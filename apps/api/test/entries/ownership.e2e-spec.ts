import {
  as,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { authenticate } from '../support/test-database';

/*
 * ADR-013: ownership is in the WHERE clause, and another person's entry is a
 * 404, never a 403. Every route that reaches an entry is asked here, because
 * each one runs its own query and any one of them could forget the owner.
 */
describe("another person's entry (e2e)", () => {
  let running: RunningApp;
  let alice: Caller;
  let bob: Caller;
  let aliceEntryId: string;

  const PRIVATE = "Alice's private thought";

  beforeEach(async () => {
    running = await startApp();
    alice = as(running.server, await authenticate(running.server, 'alice'));
    bob = as(running.server, await authenticate(running.server, 'bob'));

    aliceEntryId = (
      (await alice.post('/entries').send({ content: PRIVATE }).expect(201))
        .body as { id: string }
    ).id;
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('is a 404 on every route, the same 404 as an entry that does not exist', async () => {
    const notYours = await bob.get(`/entries/${aliceEntryId}`).expect(404);
    const doesNotExist = await bob
      .get('/entries/00000000-0000-0000-0000-000000000000')
      .expect(404);

    expect(notYours.body).toEqual({
      ...(doesNotExist.body as object),
      message: `Entry with ID ${aliceEntryId} not found`,
    });

    await bob
      .patch(`/entries/${aliceEntryId}`)
      .send({ content: 'rewritten by Bob' })
      .expect(404);
    await bob.delete(`/entries/${aliceEntryId}`).expect(404);

    /* Nothing Bob tried changed it. */
    expect(
      (await alice.get(`/entries/${aliceEntryId}`).expect(200)).body,
    ).toMatchObject({ id: aliceEntryId, content: PRIVATE });
  });

  it('is never listed, found, counted or filed under a date for anyone else', async () => {
    const bobs = (
      await bob
        .post('/entries')
        .send({ content: "Bob's private thought" })
        .expect(201)
    ).body as { date: string };

    const contents = (body: unknown) =>
      (body as { content: string }[]).map((entry) => entry.content);

    expect(contents((await bob.get('/entries').expect(200)).body)).toEqual([
      "Bob's private thought",
    ]);
    expect(
      contents((await bob.get('/entries?word=Alice').expect(200)).body),
    ).toEqual([]);
    expect(
      contents((await bob.get(`/entries?date=${bobs.date}`).expect(200)).body),
    ).toEqual(["Bob's private thought"]);
    expect((await bob.get('/entries/count').expect(200)).body).toEqual({
      count: 1,
    });
    expect(
      (await bob.get('/entries/count?word=private').expect(200)).body,
    ).toEqual({ count: 1 });

    expect(contents((await alice.get('/entries').expect(200)).body)).toEqual([
      PRIVATE,
    ]);
  });

  it('still lets its owner edit and delete it', async () => {
    await alice
      .patch(`/entries/${aliceEntryId}`)
      .send({ content: 'edited by Alice' })
      .expect(200);
    await alice.delete(`/entries/${aliceEntryId}`).expect(204);

    /* Deleted, it is invisible to Bob as well. */
    await bob.get(`/entries/${aliceEntryId}`).expect(404);
    await bob.delete(`/entries/${aliceEntryId}`).expect(404);
  });
});
