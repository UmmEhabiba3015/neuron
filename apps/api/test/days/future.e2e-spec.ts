import { as, startApp, stopApp, type RunningApp } from '../support/app';
import { freezeClockAt, moveClockTo, releaseClock } from '../support/clock';
import { authenticate, login } from '../support/test-database';

/*
 * A day that has not happened yet, and has no entry, does not exist, and
 * "not yet" is judged in the timezone of the person asking.
 * DaysService.exists and the controller's refusal are unit tests; this
 * shows the clock, the stored timezone and the routes together.
 */
describe('a day that has not happened yet (e2e)', () => {
  let running: RunningApp;

  const at = async (instant: string, who: string) => {
    moveClockTo(instant);

    return as(running.server, await login(running.server, who));
  };

  const dayRows = () =>
    running.dataSource.query<{ date: string; mood: string | null }[]>(
      `SELECT date, mood FROM days ORDER BY date`,
    );

  beforeEach(async () => {
    freezeClockAt('2026-06-01T12:00:00.000Z');
    running = await startApp();
    await authenticate(running.server, 'new-york', 'America/New_York');
    await authenticate(running.server, 'los-angeles', 'America/Los_Angeles');
  });

  afterEach(async () => {
    await stopApp(running);
    releaseClock();
  });

  /*
   * 05:00Z on 8 October is 01:00 on the 8th in New York and 22:00 on the
   * 7th in Los Angeles. The 8th is today for one and tomorrow for the other.
   */
  it('is a 404 for one person and a day for another, at the same moment', async () => {
    const instant = '2026-10-08T05:00:00.000Z';
    const date = '2026-10-08';
    const notFound = {
      message: `Day with date ${date} not found`,
      error: 'Not Found',
      statusCode: 404,
    };

    const newYork = await at(instant, 'new-york');
    const losAngeles = await at(instant, 'los-angeles');

    expect((await newYork.get(`/days/${date}`).expect(200)).body).toEqual({
      date,
      mood: null,
    });
    expect(
      (
        await newYork
          .put(`/days/${date}/mood`)
          .send({ mood: 'Even' })
          .expect(200)
      ).body,
    ).toEqual({ date, mood: 'Even' });

    expect((await losAngeles.get(`/days/${date}`).expect(404)).body).toEqual(
      notFound,
    );
    expect(
      (
        await losAngeles
          .put(`/days/${date}/mood`)
          .send({ mood: 'Even' })
          .expect(404)
      ).body,
    ).toEqual(notFound);

    /* One row, and it is New York's. The refused PUT wrote nothing. */
    expect(await dayRows()).toEqual([{ date, mood: 'Even' }]);

    /* Los Angeles reaches the 8th at its own midnight, 07:00Z. */
    const losAngelesLater = await at('2026-10-08T07:00:00.000Z', 'los-angeles');
    await losAngelesLater.get(`/days/${date}`).expect(200);
  });

  /*
   * The pipe checks the date and the body before the handler asks whether
   * the date is in the future, so these are 400s and not 404s.
   */
  it('refuses a malformed date or a bad mood before asking whether it is in the future', async () => {
    const losAngeles = await at('2026-10-08T05:00:00.000Z', 'los-angeles');

    await losAngeles.get('/days/2031-02-31').expect(400);
    await losAngeles
      .put('/days/2026-10-09/mood')
      .send({ mood: 'Ecstatic' })
      .expect(400);
    expect(await dayRows()).toEqual([]);
  });

  /* An empty collection is a complete answer (ADR-005). */
  it('still answers the collections normally for future dates', async () => {
    const newYork = await at('2026-10-08T05:00:00.000Z', 'new-york');
    await newYork
      .post('/entries')
      .send({ content: 'written today' })
      .expect(201);

    expect(
      (await newYork.get('/entries?date=2026-10-09').expect(200)).body,
    ).toEqual([]);
    expect(
      (await newYork.get('/entries/count?date=2026-10-09').expect(200)).body,
    ).toEqual({ count: 0 });
    expect(
      (await newYork.get('/days?from=2026-10-01&to=2031-12-31').expect(200))
        .body,
    ).toEqual([{ date: '2026-10-08', mood: null }]);
  });

  /*
   * Her example (ADR-015, amendment of 2026-10-15). At 20:00Z on 15 October
   * it is 01:00 on the 16th in Karachi, where she writes an entry. She moves
   * to New York, where it is 16:00 on the 15th. The entry stays on the 16th
   * (Ref 7), and the 16th, though it has not happened in New York, is a day
   * because it has an entry.
   */
  it('keeps a day reachable after a move west puts it in the future, while it has an entry', async () => {
    const instant = '2026-10-15T20:00:00.000Z';
    await authenticate(running.server, 'karachi', 'Asia/Karachi');
    const habiba = await at(instant, 'karachi');

    const written = (
      await habiba
        .post('/entries')
        .send({ content: 'one in the morning' })
        .expect(201)
    ).body as { id: string; date: string };
    expect(written.date).toBe('2026-10-16');

    await habiba
      .patch('/auth/me')
      .send({ timezone: 'America/New_York' })
      .expect(200);

    expect((await habiba.get('/days/today').expect(200)).body).toEqual({
      date: '2026-10-15',
      mood: null,
    });
    expect((await habiba.get('/days/2026-10-16').expect(200)).body).toEqual({
      date: '2026-10-16',
      mood: null,
    });
    expect(
      (
        await habiba
          .put('/days/2026-10-16/mood')
          .send({ mood: 'Good' })
          .expect(200)
      ).body,
    ).toEqual({ date: '2026-10-16', mood: 'Good' });
    expect(
      (
        (await habiba.get('/entries?date=2026-10-16').expect(200)).body as {
          id: string;
        }[]
      ).map((entry) => entry.id),
    ).toEqual([written.id]);

    /* A future day with no entry is still no day. */
    await habiba.get('/days/2026-10-17').expect(404);

    /* Nor is the 16th, once its only entry is deleted. */
    await habiba.delete(`/entries/${written.id}`).expect(204);
    await habiba.get('/days/2026-10-16').expect(404);
  });
});
