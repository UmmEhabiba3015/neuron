import {
  as,
  messagesFrom,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { freezeClockAt, releaseClock } from '../support/clock';
import { authenticate } from '../support/test-database';

/*
 * Today, and the mood of a day. Which date today is, and what a mood may be,
 * are unit tests of DaysService, dayFor and SetMoodDto; this is the flow a
 * person goes through on the Today screen.
 */
describe('today and its mood (e2e)', () => {
  let running: RunningApp;
  let alice: Caller;
  let bob: Caller;

  const TODAY = '2026-08-09';

  const dayRowCount = async () =>
    Number(
      (
        await running.dataSource.query<{ c: number }[]>(
          'SELECT COUNT(*) AS c FROM days',
        )
      )[0].c,
    );

  beforeEach(async () => {
    freezeClockAt(`${TODAY}T12:00:00.000Z`);
    running = await startApp();
    alice = as(running.server, await authenticate(running.server, 'alice'));
    bob = as(running.server, await authenticate(running.server, 'bob'));
  });

  afterEach(async () => {
    await stopApp(running);
    releaseClock();
  });

  it('shows an empty today, then sets, replaces and clears its mood', async () => {
    /* "today" is its own route, not taken for a date and refused. */
    expect((await alice.get('/days/today').expect(200)).body).toEqual({
      date: TODAY,
      mood: null,
    });

    /* Looking at a day does not make it exist. */
    expect(await dayRowCount()).toBe(0);

    expect(
      (
        await alice
          .put(`/days/${TODAY}/mood`)
          .send({ mood: 'Hard' })
          .expect(200)
      ).body,
    ).toEqual({ date: TODAY, mood: 'Hard' });
    await alice.put(`/days/${TODAY}/mood`).send({ mood: 'Good' }).expect(200);

    expect((await alice.get('/days/today').expect(200)).body).toEqual({
      date: TODAY,
      mood: 'Good',
    });
    expect((await alice.get(`/days/${TODAY}`).expect(200)).body).toEqual({
      date: TODAY,
      mood: 'Good',
    });
    expect(await dayRowCount()).toBe(1);

    await alice.put(`/days/${TODAY}/mood`).send({ mood: null }).expect(200);

    expect((await alice.get(`/days/${TODAY}`).expect(200)).body).toEqual({
      date: TODAY,
      mood: null,
    });
  });

  it("keeps one person's mood from another on the same date", async () => {
    await alice.put(`/days/${TODAY}/mood`).send({ mood: 'Hard' }).expect(200);

    expect((await bob.get('/days/today').expect(200)).body).toEqual({
      date: TODAY,
      mood: null,
    });
    expect((await bob.get(`/days/${TODAY}`).expect(200)).body).toEqual({
      date: TODAY,
      mood: null,
    });

    await bob.put(`/days/${TODAY}/mood`).send({ mood: 'Light' }).expect(200);

    expect((await alice.get(`/days/${TODAY}`).expect(200)).body).toEqual({
      date: TODAY,
      mood: 'Hard',
    });
  });

  it('answers a past day nobody touched with no mood', async () => {
    expect((await alice.get('/days/2020-01-01').expect(200)).body).toEqual({
      date: '2020-01-01',
      mood: null,
    });
  });

  /* One bad input for each route that takes one. */
  it('refuses a bad request on each route, and creates no day', async () => {
    expect(
      messagesFrom(
        await alice
          .put(`/days/${TODAY}/mood`)
          .send({ mood: 'Ecstatic' })
          .expect(400),
      ),
    ).toEqual(['mood must be null or one of: Light, Good, Even, Low, Hard']);
    expect(
      messagesFrom(await alice.get('/days/2026-02-31').expect(400)),
    ).toEqual(['date must be a real calendar date in YYYY-MM-DD form']);
    expect(
      messagesFrom(
        await alice.get('/days?from=nope&to=2026-08-31').expect(400),
      ),
    ).toEqual(['from must be a real calendar date in YYYY-MM-DD form']);

    expect(await dayRowCount()).toBe(0);
  });
});
