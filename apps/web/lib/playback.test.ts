import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ApiResult } from './api/session.ts';
import type { Request } from './today.ts';
import { createPlayback } from './playback.ts';

type Reply = ApiResult<unknown>;

const AUDIO = new Blob([new Uint8Array([9, 8, 7])], { type: 'audio/webm' });

function setUp(replies: (Reply | Promise<Reply>)[]) {
  const sent: { path: string; receive?: string }[] = [];
  const created: Blob[] = [];
  const revoked: string[] = [];

  const request = (async (path, options = {}) => {
    sent.push({ path, receive: options.receive });
    return replies.shift()!;
  }) as Request;

  const playback = createPlayback({
    request,
    entryId: 'memo-1',
    urls: {
      create: (blob) => {
        created.push(blob);
        return `blob:local/${created.length}`;
      },
      revoke: (url) => revoked.push(url),
    },
  });

  return { playback, sent, created, revoked };
}

test('nothing is asked for until play is pressed', () => {
  const { playback, sent } = setUp([]);

  assert.deepEqual(playback.getState(), { status: 'idle' });
  assert.deepEqual(sent, []);
});

test('the first press asks for the audio as bytes and gives a local address for them; the next press asks nothing', async () => {
  const { playback, sent, created } = setUp([{ kind: 'ok', data: AUDIO }]);

  assert.equal(await playback.load(), 'blob:local/1');
  assert.equal(await playback.load(), 'blob:local/1');

  assert.deepEqual(sent, [{ path: '/entries/memo-1/audio', receive: 'blob' }]);
  assert.deepEqual(created, [AUDIO]);
  assert.deepEqual(playback.getState(), {
    status: 'ready',
    url: 'blob:local/1',
  });
});

test('a press while the audio is on its way asks nothing more', async () => {
  let release!: (reply: Reply) => void;
  const { playback, sent } = setUp([
    new Promise<Reply>((resolve) => (release = resolve)),
  ]);

  const first = playback.load();
  assert.deepEqual(playback.getState(), { status: 'fetching' });
  assert.equal(await playback.load(), undefined);

  release({ kind: 'ok', data: AUDIO });
  assert.equal(await first, 'blob:local/1');
  assert.equal(sent.length, 1);
});

test('no answer, or a refusal, is said, and the next press asks again', async () => {
  const { playback, sent } = setUp([
    { kind: 'unreachable' },
    { kind: 'rejected', status: 404, messages: [] },
    { kind: 'ok', data: AUDIO },
  ]);

  assert.equal(await playback.load(), undefined);
  assert.deepEqual(playback.getState(), { status: 'failed', why: 'unreachable' });

  assert.equal(await playback.load(), undefined);
  assert.deepEqual(playback.getState(), { status: 'failed', why: 'refused' });

  assert.equal(await playback.load(), 'blob:local/1');
  assert.equal(sent.length, 3);
});

test('an ended session says nothing here', async () => {
  const { playback } = setUp([{ kind: 'ended' }]);

  await playback.load();

  assert.deepEqual(playback.getState(), { status: 'idle' });
});

test('releasing gives the local address back, and nothing is played after', async () => {
  const { playback, revoked } = setUp([{ kind: 'ok', data: AUDIO }]);

  await playback.load();
  playback.release();

  assert.deepEqual(revoked, ['blob:local/1']);
  assert.equal(await playback.load(), undefined);
});

test('audio that arrives after the memo has left the screen is never given an address', async () => {
  let release!: (reply: Reply) => void;
  const { playback, created, revoked } = setUp([
    new Promise<Reply>((resolve) => (release = resolve)),
  ]);

  const loading = playback.load();
  playback.release();
  release({ kind: 'ok', data: AUDIO });

  assert.equal(await loading, undefined);
  assert.deepEqual(created, []);
  assert.deepEqual(revoked, []);
});
