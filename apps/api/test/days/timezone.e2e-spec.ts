import { as, startApp, stopApp, type RunningApp } from '../support/app';
import { freezeClockAt, moveClockTo, releaseClock } from '../support/clock';
import { authenticate, login } from '../support/test-database';

/*
 * A day ends at midnight in the timezone of its person, and the server
 * decides an entry's day when the entry is written (ADR-015). dayFor's
 * arithmetic -- midnight, daylight saving, month and year ends -- is its own
 * unit test. Here the clock, the stored timezone, the write and every reader
 * have to agree.
 */
describe('an entry filed on its day in the timezone of its person (e2e)', () => {
  let running: RunningApp;

  const at = async (instant: string, who: string) => {
    moveClockTo(instant);
    const caller = as(running.server, await login(running.server, who));

    return {
      today: async () =>
        ((await caller.get('/days/today').expect(200)).body as { date: string })
          .date,
      write: async (content: string) =>
        (await caller.post('/entries').send({ content }).expect(201)).body as {
          id: string;
          createdAt: string;
          date: string;
        },
      writtenOn: async (date: string) =>
        (
          (await caller.get(`/entries?date=${date}`).expect(200)).body as {
            content: string;
          }[]
        ).map((entry) => entry.content),
      datesWithEntries: async () =>
        (
          (await caller.get('/days?from=2026-01-01&to=2026-12-31').expect(200))
            .body as { date: string }[]
        ).map((day) => day.date),
      entry: async (id: string) =>
        (await caller.get(`/entries/${id}`).expect(200)).body as {
          date: string;
        },
    };
  };

  beforeEach(async () => {
    freezeClockAt('2026-06-01T12:00:00.000Z');
    running = await startApp();
  });

  afterEach(async () => {
    await stopApp(running);
    releaseClock();
  });

  /*
   * 05:00Z on 8 October is 01:00 on the 8th in New York and 22:00 on the
   * 7th in Los Angeles. The Los Angeles entry's createdAt begins with the
   * 8th and its date is the 7th: the date is the one to believe.
   */
  it('files one instant under two dates for two people, and every reader agrees', async () => {
    await authenticate(running.server, 'new-york', 'America/New_York');
    await authenticate(running.server, 'los-angeles', 'America/Los_Angeles');
    const instant = '2026-10-08T05:00:00.000Z';

    const newYork = await at(instant, 'new-york');
    const losAngeles = await at(instant, 'los-angeles');

    const morning = await newYork.write('one in the morning');
    const night = await losAngeles.write('ten at night');

    expect(await newYork.today()).toBe('2026-10-08');
    expect(morning).toMatchObject({ createdAt: instant, date: '2026-10-08' });
    expect(await newYork.writtenOn('2026-10-08')).toEqual([
      'one in the morning',
    ]);
    expect(await newYork.writtenOn('2026-10-07')).toEqual([]);
    expect(await newYork.datesWithEntries()).toEqual(['2026-10-08']);

    expect(await losAngeles.today()).toBe('2026-10-07');
    expect(night).toMatchObject({ createdAt: instant, date: '2026-10-07' });
    expect(await losAngeles.writtenOn('2026-10-07')).toEqual(['ten at night']);
    expect(await losAngeles.writtenOn('2026-10-08')).toEqual([]);
    expect(await losAngeles.datesWithEntries()).toEqual(['2026-10-07']);
  });

  /* Karachi is five hours ahead of UTC, so its midnight is 19:00Z. */
  it('starts a new day at midnight where the person is, not in UTC', async () => {
    await authenticate(running.server, 'karachi', 'Asia/Karachi');

    const before = await at('2026-08-09T18:59:59.000Z', 'karachi');
    await before.write('one second before midnight');
    expect(await before.today()).toBe('2026-08-09');

    const after = await at('2026-08-09T19:00:00.000Z', 'karachi');
    await after.write('midnight exactly');
    expect(await after.today()).toBe('2026-08-10');

    expect(await after.writtenOn('2026-08-09')).toEqual([
      'one second before midnight',
    ]);
    expect(await after.writtenOn('2026-08-10')).toEqual(['midnight exactly']);
    expect(await after.datesWithEntries()).toEqual([
      '2026-08-10',
      '2026-08-09',
    ]);
  });

  it('leaves an entry on its day when the timezone changes, and files the next by the new one', async () => {
    await authenticate(running.server, 'traveller', 'America/Los_Angeles');
    const instant = '2026-10-08T05:00:00.000Z';

    const inLosAngeles = await (
      await at(instant, 'traveller')
    ).write('written in Los Angeles');
    expect(inLosAngeles.date).toBe('2026-10-07');

    await running.dataSource.query(
      `UPDATE users SET timezone = 'Asia/Tokyo' WHERE email = 'traveller@example.com'`,
    );

    const inTokyo = await at(instant, 'traveller');
    await inTokyo.write('written in Tokyo');

    expect(await inTokyo.today()).toBe('2026-10-08');
    expect((await inTokyo.entry(inLosAngeles.id)).date).toBe('2026-10-07');
    expect(await inTokyo.writtenOn('2026-10-07')).toEqual([
      'written in Los Angeles',
    ]);
    expect(await inTokyo.writtenOn('2026-10-08')).toEqual(['written in Tokyo']);
  });
});
