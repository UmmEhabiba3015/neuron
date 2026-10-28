import type { Entry, JournalExport } from '@neuron/contracts';
import { strFromU8, unzipSync } from 'fflate';
import {
  as,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { authenticate } from '../support/test-database';

/*
 * Keep out of memory through the running app (features.md, Ref 25): chosen
 * when an entry is saved, typed or recorded, and taken off with
 * PUT /entries/:id/memory, which goes one way. The rules of each field are
 * unit tests; here are the flows, ownership, and one bad body.
 */
describe('keep out of memory (e2e)', () => {
  let running: RunningApp;
  let alice: Caller;
  let bob: Caller;

  const RECORDING = Buffer.from('any bytes will do');

  const record = (caller: Caller, keptOutOfMemory?: string) => {
    const form = caller.post('/entries/voice').field('durationMs', '5000');

    if (keptOutOfMemory !== undefined) {
      form.field('keptOutOfMemory', keptOutOfMemory);
    }

    return form.attach('audio', RECORDING, {
      filename: 'memo.webm',
      contentType: 'audio/webm',
    });
  };

  const journalOf = async (caller: Caller) => {
    const response = await caller
      .get('/export')
      .responseType('blob')
      .expect(200);
    const files = unzipSync(new Uint8Array(response.body as Buffer));

    return JSON.parse(strFromU8(files['journal.json'])) as JournalExport;
  };

  beforeEach(async () => {
    running = await startApp();
    alice = as(running.server, await authenticate(running.server, 'alice'));
    bob = as(running.server, await authenticate(running.server, 'bob'));
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('writes an entry kept out, shows it kept out, puts it in memory, and the export says so', async () => {
    const written = (
      await alice
        .post('/entries')
        .send({ content: 'only for me', keptOutOfMemory: true })
        .expect(201)
    ).body as Entry;
    const ordinary = (
      await alice.post('/entries').send({ content: 'ordinary' }).expect(201)
    ).body as Entry;

    expect(written.keptOutOfMemory).toBe(true);
    expect(ordinary.keptOutOfMemory).toBe(false);
    expect(
      ((await alice.get(`/entries/${written.id}`).expect(200)).body as Entry)
        .keptOutOfMemory,
    ).toBe(true);
    expect(
      ((await alice.get('/entries?word=only').expect(200)).body as Entry[]).map(
        (entry) => entry.id,
      ),
    ).toEqual([written.id]);

    const before = await journalOf(alice);
    expect(before.days[0].entries.map((e) => e.keptOutOfMemory)).toEqual([
      true,
      false,
    ]);

    const put = (await alice.put(`/entries/${written.id}/memory`).expect(200))
      .body as Entry;
    expect(put).toEqual({ ...written, keptOutOfMemory: false });

    /* Again: an entry in memory stays in memory, and the answer is the same. */
    expect(
      (await alice.put(`/entries/${written.id}/memory`).expect(200)).body,
    ).toEqual(put);

    const after = await journalOf(alice);
    expect(after.days[0].entries.map((e) => e.keptOutOfMemory)).toEqual([
      false,
      false,
    ]);
  });

  it('records a memo kept out, reading "false" as false, and puts it in memory', async () => {
    const kept = (await record(alice, 'true').expect(201)).body as Entry;
    const notKept = (await record(alice, 'false').expect(201)).body as Entry;
    const unsaid = (await record(alice).expect(201)).body as Entry;

    expect(kept.keptOutOfMemory).toBe(true);
    expect(notKept.keptOutOfMemory).toBe(false);
    expect(unsaid.keptOutOfMemory).toBe(false);

    const put = (await alice.put(`/entries/${kept.id}/memory`).expect(200))
      .body as Entry;
    expect(put).toEqual({ ...kept, keptOutOfMemory: false });
  });

  it("is a 404 for another person's entry, a deleted one and one that does not exist, and leaves them as they were", async () => {
    const alices = (
      await alice
        .post('/entries')
        .send({ content: 'hers', keptOutOfMemory: true })
        .expect(201)
    ).body as Entry;
    const deleted = (
      await alice
        .post('/entries')
        .send({ content: 'gone', keptOutOfMemory: true })
        .expect(201)
    ).body as Entry;
    await alice.delete(`/entries/${deleted.id}`).expect(204);

    await bob.put(`/entries/${alices.id}/memory`).expect(404);
    await alice.put(`/entries/${deleted.id}/memory`).expect(404);
    await alice.put(`/entries/${crypto.randomUUID()}/memory`).expect(404);

    expect(
      ((await alice.get(`/entries/${alices.id}`).expect(200)).body as Entry)
        .keptOutOfMemory,
    ).toBe(true);
  });

  it('refuses a mark that is not exactly "true" or "false", and refuses to keep out an entry already saved', async () => {
    await record(alice, 'yes').expect(400);

    const saved = (
      await alice.post('/entries').send({ content: 'in memory' }).expect(201)
    ).body as Entry;

    await alice
      .patch(`/entries/${saved.id}`)
      .send({ content: 'in memory', keptOutOfMemory: true })
      .expect(400);

    expect(
      ((await alice.get(`/entries/${saved.id}`).expect(200)).body as Entry)
        .keptOutOfMemory,
    ).toBe(false);
  });
});
