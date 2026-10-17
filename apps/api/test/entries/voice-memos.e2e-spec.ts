import { EntryKind } from '@neuron/contracts';
import {
  as,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { authenticate } from '../support/test-database';

/*
 * A voice memo through the running app (ADR-023): uploaded as a multipart
 * form, listed with the day's entries, played back byte for byte, private to
 * its owner (ADR-013), and gone once deleted (ADR-020). Each upload rule is
 * a unit test of its own; one bad upload here shows the rules are connected.
 */
describe('voice memos (e2e)', () => {
  let running: RunningApp;
  let alice: Caller;
  let bob: Caller;

  /* Any bytes will do: the API keeps them and never opens them. */
  const RECORDING = Buffer.from(
    Array.from({ length: 4096 }, (_, index) => index % 256),
  );

  const upload = (
    caller: Caller,
    bytes = RECORDING,
    contentType = 'audio/webm;codecs=opus',
  ) =>
    caller
      .post('/entries/voice')
      .field('durationMs', '72000')
      .attach('audio', bytes, { filename: 'whatever.webm', contentType });

  const audioOf = (caller: Caller, id: string) =>
    caller.get(`/entries/${id}/audio`).responseType('blob');

  beforeEach(async () => {
    running = await startApp();
    alice = as(running.server, await authenticate(running.server, 'alice'));
    bob = as(running.server, await authenticate(running.server, 'bob'));
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('files an upload on today, lists it, and plays back the same bytes with the type recorded', async () => {
    const memo = (await upload(alice).expect(201)).body as {
      id: string;
      date: string;
    };
    const today = (await alice.get('/days/today').expect(200)).body as {
      date: string;
    };

    expect(memo).toEqual({
      id: expect.any(String) as string,
      kind: EntryKind.Voice,
      content: null,
      durationMs: 72_000,
      createdAt: expect.any(String) as string,
      date: today.date,
    });

    const listed = (await alice.get(`/entries?date=${today.date}`).expect(200))
      .body as unknown[];
    expect(listed).toEqual([memo]);

    const played = await audioOf(alice, memo.id).expect(200);
    /*
     * Multer hands over the type of the form's part without its parameters,
     * so the codec the browser named is not kept.
     */
    expect(played.headers['content-type']).toBe('audio/webm');
    expect(played.body).toEqual(RECORDING);
  });

  it("is a 404 for another person's audio, and does not let them edit it", async () => {
    const memo = (await upload(alice).expect(201)).body as { id: string };

    const notYours = await audioOf(bob, memo.id).expect(404);
    const doesNotExist = await audioOf(
      bob,
      '00000000-0000-0000-0000-000000000000',
    ).expect(404);

    expect(notYours.headers['content-type']).toMatch(/json/);
    expect(doesNotExist.status).toBe(notYours.status);
    await bob
      .patch(`/entries/${memo.id}`)
      .send({ content: 'words' })
      .expect(404);
  });

  it('lists and counts by kind, both routes alike, and refuses a kind that does not exist', async () => {
    const memo = (await upload(alice).expect(201)).body as { id: string };
    await alice.post('/entries').send({ content: 'typed' }).expect(201);
    await upload(bob).expect(201);

    const ids = async (query: string) =>
      (
        (await alice.get(`/entries${query}`).expect(200)).body as {
          id: string;
        }[]
      ).map((entry) => entry.id);
    const count = async (query: string) =>
      (
        (await alice.get(`/entries/count${query}`).expect(200)).body as {
          count: number;
        }
      ).count;

    expect(await ids(`?kind=${EntryKind.Voice}`)).toEqual([memo.id]);
    expect(await ids(`?kind=${EntryKind.Text}`)).toHaveLength(1);
    expect(await count(`?kind=${EntryKind.Voice}`)).toBe(1);
    expect(await count(`?kind=${EntryKind.Text}`)).toBe(1);
    expect(await count('')).toBe(2);

    await alice.get('/entries?kind=Song').expect(400);
    await alice.get('/entries/count?kind=Song').expect(400);
  });

  it('refuses to edit a memo, for its owner too', async () => {
    const memo = (await upload(alice).expect(201)).body as { id: string };

    await alice
      .patch(`/entries/${memo.id}`)
      .send({ content: 'words' })
      .expect(400);
  });

  it('is gone once deleted: not listed, not played, not deleted twice', async () => {
    const memo = (await upload(alice).expect(201)).body as { id: string };

    await alice.delete(`/entries/${memo.id}`).expect(204);

    await audioOf(alice, memo.id).expect(404);
    await alice.get(`/entries/${memo.id}`).expect(404);
    await alice.delete(`/entries/${memo.id}`).expect(404);
    expect((await alice.get('/entries').expect(200)).body).toEqual([]);
  });

  it('refuses a recording of another type with a 400, and files nothing', async () => {
    const refused = await upload(alice, RECORDING, 'audio/ogg').expect(400);

    expect((refused.body as { message: string }).message).toBe(
      'The recording must be audio/webm or audio/mp4',
    );
    expect((await alice.get('/entries/count').expect(200)).body).toEqual({
      count: 0,
    });
  });

  it('is a 404 for the audio of a typed entry', async () => {
    const typed = (
      await alice.post('/entries').send({ content: 'words' }).expect(201)
    ).body as { id: string; kind: string; durationMs: null };

    expect(typed).toMatchObject({ kind: EntryKind.Text, durationMs: null });
    await audioOf(alice, typed.id).expect(404);
  });
});
