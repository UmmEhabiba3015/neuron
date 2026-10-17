import { EntryKind } from '@neuron/contracts';
import { unzipSync } from 'fflate';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { REFRESH_COOKIE_NAME } from '../../src/auth/refresh-cookie';
import { as, startApp, stopApp, type RunningApp } from '../support/app';
import {
  refreshCookieFrom,
  type RefreshCookie,
} from '../support/refresh-cookie';

/*
 * Export, then delete the account (ADR-024, ADR-025), through the running
 * app: every row in all five tables goes, every file goes, the refresh
 * cookie stops working, and another person's journal is untouched. The
 * order of the deletes and each rule of the password are unit tests of
 * AccountDeletionService.
 */
describe('deleting an account (e2e)', () => {
  let running: RunningApp;

  const PASSWORD = 'a-long-enough-password';
  const AUDIO_PATH = process.env.AUDIO_PATH!;
  const TABLES = ['entries', 'days', 'password_resets', 'sessions', 'users'];

  interface Person {
    id: string;
    authorization: string;
    cookie: RefreshCookie;
  }

  const signUp = async (email: string): Promise<Person> => {
    const registered = await request(running.server)
      .post('/auth/register')
      .send({ email, password: PASSWORD, name: email, timezone: 'UTC' })
      .expect(201);
    const signedIn = await request(running.server)
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);

    return {
      id: (registered.body as { id: string }).id,
      authorization: `Bearer ${(signedIn.body as { accessToken: string }).accessToken}`,
      cookie: refreshCookieFrom(signedIn),
    };
  };

  /* A typed entry, a memo, a deleted memo, a mood and a reset request. */
  const fill = async (person: Person): Promise<string[]> => {
    const caller = as(running.server, person.authorization);
    const upload = async () =>
      (
        await caller
          .post('/entries/voice')
          .field('durationMs', '3000')
          .attach('audio', Buffer.from('bytes'), {
            filename: 'memo.webm',
            contentType: 'audio/webm',
          })
          .expect(201)
      ).body as { id: string; date: string };

    await caller.post('/entries').send({ content: 'words 😀' }).expect(201);
    const kept = await upload();
    const deleted = await upload();
    await caller.delete(`/entries/${deleted.id}`).expect(204);
    await caller
      .put(`/days/${kept.date}/mood`)
      .send({ mood: 'Good' })
      .expect(200);
    await running.dataSource.query(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, used_at, created_at)
       VALUES (?, ?, ?, '2099-01-01T00:00:00.000Z', NULL, '2026-10-16T00:00:00.000Z')`,
      [`${person.id}-reset`, person.id, `${person.id}-hash`],
    );

    return keysOf(person);
  };

  const keysOf = async (person: Person): Promise<string[]> =>
    (
      await running.dataSource.query<{ audio_key: string }[]>(
        'SELECT audio_key FROM entries WHERE user_id = ? AND audio_key IS NOT NULL',
        [person.id],
      )
    ).map((row) => row.audio_key);

  const rowsOf = async (person: Person): Promise<number[]> => {
    const counts: number[] = [];

    for (const table of TABLES) {
      const [{ n }] = await running.dataSource.query<{ n: number }[]>(
        `SELECT COUNT(*) AS n FROM ${table} WHERE ${table === 'users' ? 'id' : 'user_id'} = ?`,
        [person.id],
      );
      counts.push(n);
    }

    return counts;
  };

  const deleteAccount = (person: Person, body: object) =>
    as(running.server, person.authorization)
      .delete('/auth/me')
      .set('Cookie', person.cookie.pair)
      .send(body);

  beforeEach(async () => {
    running = await startApp();
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('exports, then deletes everything of one person and nothing of another', async () => {
    const alice = await signUp('alice@example.com');
    const bob = await signUp('bob@example.com');
    const aliceFiles = await fill(alice);
    const bobFiles = await fill(bob);

    expect(aliceFiles).toHaveLength(2);
    expect(await rowsOf(alice)).toEqual([3, 1, 1, 1, 1]);

    const exported = await as(running.server, alice.authorization)
      .get('/export')
      .responseType('blob')
      .expect(200);
    expect(Object.keys(unzipSync(exported.body as Buffer))).toHaveLength(3);

    const deleted = await deleteAccount(alice, { password: PASSWORD }).expect(
      204,
    );

    expect(deleted.headers['set-cookie']).toEqual([
      expect.stringMatching(new RegExp(`^${REFRESH_COOKIE_NAME}=;`)) as string,
    ]);
    expect(await rowsOf(alice)).toEqual([0, 0, 0, 0, 0]);
    for (const key of aliceFiles) {
      expect(existsSync(join(AUDIO_PATH, key))).toBe(false);
    }

    /* Signed out on every device: the cookie and the token both refused. */
    await request(running.server)
      .post('/auth/refresh')
      .set('Cookie', alice.cookie.pair)
      .expect(401);
    await as(running.server, alice.authorization).get('/auth/me').expect(401);
    await request(running.server)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: PASSWORD })
      .expect(401);

    expect(await rowsOf(bob)).toEqual([3, 1, 1, 1, 1]);
    for (const key of bobFiles) {
      expect(readdirSync(AUDIO_PATH)).toContain(key);
    }
    const bobs = as(running.server, bob.authorization);
    expect(
      (await bobs.get(`/entries?kind=${EntryKind.Voice}`).expect(200)).body,
    ).toHaveLength(1);
  });

  it('refuses a wrong password with a 400, not a 401, and deletes nothing', async () => {
    const alice = await signUp('alice@example.com');
    await fill(alice);

    const refused = await deleteAccount(alice, { password: 'not-it' }).expect(
      400,
    );

    expect((refused.body as { message: string }).message).toBe(
      'That password is not right',
    );
    expect(refused.headers['set-cookie']).toBeUndefined();
    expect(await rowsOf(alice)).toEqual([3, 1, 1, 1, 1]);
    await as(running.server, alice.authorization).get('/auth/me').expect(200);
  });

  it('refuses a body with no password, as validation does', async () => {
    const alice = await signUp('alice@example.com');

    await deleteAccount(alice, {}).expect(400);
    expect(await rowsOf(alice)).toEqual([0, 0, 0, 1, 1]);
  });
});
