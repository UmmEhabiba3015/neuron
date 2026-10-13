import {
  as,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { freezeClockAt, releaseClock } from '../support/clock';
import { authenticate, seedEntries } from '../support/test-database';

/*
 * The calendar asks for a range of days and marks each with its mood. A
 * date is listed only while it has an entry that is not deleted (ADR-020,
 * decision 5); that query is a unit test of DaysRepository. This is the
 * calendar seen over HTTP as entries come and go.
 */
describe('the days in a range (e2e)', () => {
  let running: RunningApp;
  let alice: Caller;
  let bob: Caller;

  const datesAndMoods = async (caller: Caller, from: string, to: string) =>
    (await caller.get(`/days?from=${from}&to=${to}`).expect(200)).body as {
      date: string;
      mood: string | null;
    }[];

  /* The clock is on the latest date used, since a mood cannot be set later. */
  beforeEach(async () => {
    freezeClockAt('2026-10-05T12:00:00.000Z');
    running = await startApp();
    alice = as(running.server, await authenticate(running.server, 'alice'));
    bob = as(running.server, await authenticate(running.server, 'bob'));

    const [{ id: aliceId }] = await running.dataSource.query<{ id: string }[]>(
      `SELECT id FROM users WHERE email = 'alice@example.com'`,
    );

    for (const [date, mood] of [
      ['2026-07-31', 'Low'],
      ['2026-08-01', 'Even'],
      ['2026-08-15', 'Good'],
      ['2026-08-31', 'Hard'],
      ['2026-09-01', 'Light'],
    ] as const) {
      await seedEntries(
        running.dataSource,
        [
          {
            id: `entry-on-${date}`,
            content: `written on ${date}`,
            createdAt: `${date}T12:00:00.000Z`,
          },
        ],
        aliceId,
      );
      await alice.put(`/days/${date}/mood`).send({ mood }).expect(200);
    }
  });

  afterEach(async () => {
    await stopApp(running);
    releaseClock();
  });

  it('lists the days inside the range, both ends included, newest first, with their moods', async () => {
    expect(await datesAndMoods(alice, '2026-08-01', '2026-08-31')).toEqual([
      { date: '2026-08-31', mood: 'Hard' },
      { date: '2026-08-15', mood: 'Good' },
      { date: '2026-08-01', mood: 'Even' },
    ]);
    expect(await datesAndMoods(alice, '2025-01-01', '2025-12-31')).toEqual([]);
    expect(await datesAndMoods(bob, '2026-01-01', '2026-12-31')).toEqual([]);
  });

  it('marks a date while it has an entry, and not for a mood alone or for deleted entries', async () => {
    const october = () => datesAndMoods(alice, '2026-10-01', '2026-10-31');

    await alice.put('/days/2026-10-04/mood').send({ mood: 'Even' }).expect(200);
    expect(await october()).toEqual([]);

    const first = (
      (await alice.post('/entries').send({ content: 'one' }).expect(201))
        .body as { id: string }
    ).id;
    const second = (
      (await alice.post('/entries').send({ content: 'two' }).expect(201))
        .body as { id: string }
    ).id;
    expect(await october()).toEqual([{ date: '2026-10-05', mood: null }]);

    await alice.put('/days/2026-10-05/mood').send({ mood: 'Low' }).expect(200);
    await alice.delete(`/entries/${first}`).expect(204);
    expect(await october()).toEqual([{ date: '2026-10-05', mood: 'Low' }]);

    await alice.delete(`/entries/${second}`).expect(204);
    expect(await october()).toEqual([]);

    /* Written on again, the date comes back with the mood it had. */
    await alice.post('/entries').send({ content: 'three' }).expect(201);
    expect(await october()).toEqual([{ date: '2026-10-05', mood: 'Low' }]);

    /* Alice writing on a date marks nothing on Bob's calendar. */
    expect(await datesAndMoods(bob, '2026-10-01', '2026-10-31')).toEqual([]);
  });
});
