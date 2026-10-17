import { EntryKind, type JournalExport } from '@neuron/contracts';
import { strFromU8, unzipSync } from 'fflate';
import request from 'supertest';
import {
  as,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { freezeClockAt, releaseClock } from '../support/clock';
import { authenticate } from '../support/test-database';

/*
 * GET /export through the running app (ADR-025). What is in the ZIP, its
 * order and the replaced characters are unit tests of ExportService and the
 * PDF; here are the headers a browser needs, and ownership.
 */
describe('export (e2e)', () => {
  let running: RunningApp;
  let alice: Caller;
  let bob: Caller;

  const exportOf = (caller: Caller) =>
    caller.get('/export').responseType('blob');

  beforeEach(async () => {
    freezeClockAt('2026-10-16T20:00:00.000Z');
    running = await startApp();
    alice = as(
      running.server,
      await authenticate(running.server, 'alice', 'Asia/Karachi'),
    );
    bob = as(running.server, await authenticate(running.server, 'bob'));
  });

  afterEach(async () => {
    await stopApp(running);
    releaseClock();
  });

  it("answers a ZIP named with the person's own date, and lets the web app read the name", async () => {
    await alice.post('/entries').send({ content: 'hello' }).expect(201);

    const response = await exportOf(alice)
      .set('Origin', process.env.WEB_ORIGIN!)
      .expect(200);

    expect(response.headers['content-type']).toBe('application/zip');
    /* 20:00Z on the 16th is the 17th in Karachi. */
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="neuron-export-2026-10-17.zip"',
    );
    expect(response.headers['access-control-expose-headers']).toMatch(
      /Content-Disposition/i,
    );
  });

  it("holds only the caller's own live entries", async () => {
    await alice.post('/entries').send({ content: 'mine' }).expect(201);
    const gone = (await alice.post('/entries').send({ content: 'gone' }))
      .body as { id: string };
    await alice.delete(`/entries/${gone.id}`).expect(204);
    await bob.post('/entries').send({ content: "bob's" }).expect(201);
    await bob
      .post('/entries/voice')
      .field('durationMs', '1000')
      .attach('audio', Buffer.from('x'), {
        filename: 'x.webm',
        contentType: 'audio/webm',
      })
      .expect(201);

    const files = unzipSync((await exportOf(alice).expect(200)).body as Buffer);
    const journal = JSON.parse(
      strFromU8(files['journal.json']),
    ) as JournalExport;

    expect(Object.keys(files).sort()).toEqual(['journal.json', 'journal.pdf']);
    expect(journal.days.flatMap((day) => day.entries)).toEqual([
      expect.objectContaining({ kind: EntryKind.Text, content: 'mine' }),
    ]);
  });

  it('refuses a caller with no token, which is the only input it has', async () => {
    await request(running.server).get('/export').expect(401);
  });
});
