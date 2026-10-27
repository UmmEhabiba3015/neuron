import { EntryKind } from '@neuron/contracts';
import {
  as,
  messagesFrom,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { freezeClockAt, moveClockTo, releaseClock } from '../support/clock';
import { authenticate } from '../support/test-database';

interface EntryBody {
  id: string;
  content: string;
  createdAt: string;
  date: string;
}

/*
 * The life of an entry through every route that touches one. What each
 * service and repository decides is tested beside it; this is the whole
 * path, from the HTTP request to the row and back.
 *
 * Everything happens inside fifteen minutes of the clock, because that is
 * how long an access token lasts.
 */
describe('the journal (e2e)', () => {
  let running: RunningApp;
  let alice: Caller;

  const rowOf = async (id: string) =>
    (
      await running.dataSource.query<
        { content: string; deleted_at: string | null }[]
      >(`SELECT content, deleted_at FROM entries WHERE id = $1`, [id])
    )[0];

  beforeEach(async () => {
    freezeClockAt('2026-08-09T12:00:00.000Z');
    running = await startApp();
    alice = as(running.server, await authenticate(running.server, 'alice'));
  });

  afterEach(async () => {
    await stopApp(running);
    releaseClock();
  });

  it('writes, lists, reads, edits and deletes an entry, which is then gone from every reader', async () => {
    const padded = '  walked the canal, the long way  ';
    const created = (
      await alice.post('/entries').send({ content: padded }).expect(201)
    ).body as EntryBody;

    expect(created).toEqual({
      id: created.id,
      kind: EntryKind.Text,
      content: padded,
      durationMs: null,
      createdAt: '2026-08-09T12:00:00.000Z',
      date: '2026-08-09',
    });
    expect(Object.keys(created)).toEqual([
      'id',
      'kind',
      'content',
      'durationMs',
      'createdAt',
      'date',
    ]);

    moveClockTo('2026-08-09T12:01:00.000Z');
    const other = (
      await alice
        .post('/entries')
        .send({ content: 'work was work' })
        .expect(201)
    ).body as EntryBody;

    expect((await alice.get('/entries').expect(200)).body).toEqual([
      other,
      created,
    ]);
    expect(
      (await alice.get(`/entries/${created.id}`).expect(200)).body,
    ).toEqual(created);
    expect((await alice.get('/entries/count').expect(200)).body).toEqual({
      count: 2,
    });

    const edited = (
      await alice
        .patch(`/entries/${created.id}`)
        .send({ content: 'walked the canal again' })
        .expect(200)
    ).body as EntryBody;

    expect(edited).toEqual({ ...created, content: 'walked the canal again' });

    moveClockTo('2026-08-09T12:05:00.000Z');
    const deleted = await alice.delete(`/entries/${created.id}`).expect(204);

    expect(deleted.text).toBe('');
    expect(deleted.headers['content-type']).toBeUndefined();

    /* A soft delete (ADR-020): the row stays, with the instant it went. */
    expect(await rowOf(created.id)).toEqual({
      content: 'walked the canal again',
      deleted_at: '2026-08-09T12:05:00.000Z',
    });

    const never = '00000000-0000-0000-0000-000000000000';
    const gone = await alice.get(`/entries/${created.id}`).expect(404);
    const missing = await alice.get(`/entries/${never}`).expect(404);

    expect(JSON.stringify(gone.body).replaceAll(created.id, never)).toBe(
      JSON.stringify(missing.body),
    );

    expect((await alice.get('/entries').expect(200)).body).toEqual([other]);
    expect((await alice.get('/entries?word=canal').expect(200)).body).toEqual(
      [],
    );
    expect(
      (await alice.get('/entries?date=2026-08-09').expect(200)).body,
    ).toEqual([other]);
    expect(
      (await alice.get('/entries?limit=1&offset=0').expect(200)).body,
    ).toEqual([other]);
    expect((await alice.get('/entries/count').expect(200)).body).toEqual({
      count: 1,
    });
    expect(
      (await alice.get('/entries/count?word=canal').expect(200)).body,
    ).toEqual({ count: 0 });

    moveClockTo('2026-08-09T12:09:00.000Z');
    await alice
      .patch(`/entries/${created.id}`)
      .send({ content: 'written over a deleted entry' })
      .expect(404);
    await alice.delete(`/entries/${created.id}`).expect(404);

    expect(await rowOf(created.id)).toEqual({
      content: 'walked the canal again',
      deleted_at: '2026-08-09T12:05:00.000Z',
    });
  });

  it('keeps the day and its mood when the last entry of the day is deleted', async () => {
    const only = (
      await alice.post('/entries').send({ content: 'the only one' }).expect(201)
    ).body as EntryBody;
    await alice.put('/days/2026-08-09/mood').send({ mood: 'Good' }).expect(200);

    await alice.delete(`/entries/${only.id}`).expect(204);

    expect((await alice.get('/days/today').expect(200)).body).toEqual({
      date: '2026-08-09',
      mood: 'Good',
    });

    const again = (
      await alice
        .post('/entries')
        .send({ content: 'written after' })
        .expect(201)
    ).body as EntryBody;

    expect(
      (await alice.get('/entries?date=2026-08-09').expect(200)).body,
    ).toEqual([again]);
    expect(
      (await alice.get('/days?from=2026-08-09&to=2026-08-09').expect(200)).body,
    ).toEqual([{ date: '2026-08-09', mood: 'Good' }]);
  });

  /*
   * One bad input for each route that takes one. The rest of the input
   * rules are in the DTO unit tests.
   */
  it('refuses a bad request on each route, and changes nothing', async () => {
    const kept = (
      await alice.post('/entries').send({ content: 'unchanged' }).expect(201)
    ).body as EntryBody;

    expect(
      messagesFrom(
        await alice.post('/entries').send({ content: '   ' }).expect(400),
      ),
    ).toEqual([
      'content must contain at least one character that is not whitespace',
    ]);
    expect(
      messagesFrom(
        await alice
          .post('/entries')
          .send({ content: 'x', id: 'i-picked-this-myself' })
          .expect(400),
      ),
    ).toEqual(['property id should not exist']);
    expect(
      messagesFrom(
        await alice.patch(`/entries/${kept.id}`).send({}).expect(400),
      ),
    ).toEqual(['the request body must contain at least one field to update']);
    expect(
      messagesFrom(await alice.get('/entries?werd=sister').expect(400)),
    ).toEqual(['property werd should not exist']);
    expect(
      messagesFrom(
        await alice.get('/entries/count?date=2026-02-31').expect(400),
      ),
    ).toEqual(['date must be a real calendar date in YYYY-MM-DD form']);

    expect((await alice.get('/entries').expect(200)).body).toEqual([kept]);
  });
});
