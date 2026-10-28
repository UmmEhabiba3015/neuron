import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EntryKind, type Entry } from '@neuron/contracts';
import type { ApiResult } from './api/session.ts';
import type { Request, TodayState } from './today.ts';
import {
  AUDIO_FIELD,
  createUploads,
  followUploads,
  uploadsShownOn,
  type Upload,
} from './uploads.ts';

const TODAY = '2026-10-07';
type Reply = ApiResult<unknown>;

const NO_ANSWER: Reply = { kind: 'unreachable' };
const SERVER_ERROR: Reply = { kind: 'rejected', status: 500, messages: [] };

const memoEntry = (id: string, date = TODAY): Entry => ({
  id,
  kind: EntryKind.Voice,
  content: null,
  durationMs: 72_000,
  createdAt: `${date}T21:58:00.000Z`,
  date,
  keptOutOfMemory: false,
});

const KEPT = {
  audio: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' }),
  type: 'audio/webm;codecs=opus',
  durationMs: 72_000,
};

function held() {
  let release!: (reply: Reply) => void;
  const reply = new Promise<Reply>((resolve) => {
    release = resolve;
  });

  return { reply, release };
}

/* Answers POST /entries/voice with whatever the test queues, in order. */
function fakeApi(replies: (Reply | Promise<Reply>)[]) {
  const sent: { path: string; method?: string; form?: FormData }[] = [];

  const request = (async (path, options = {}) => {
    sent.push({ path, method: options.method, form: options.form });

    const reply = replies.shift();

    if (!reply) {
      throw new Error(`no answer written for ${path}`);
    }

    return reply;
  }) as Request;

  return { request, sent };
}

let ids = 0;
const newId = () => `local-${(ids += 1)}`;

const statuses = (uploads: readonly Upload[]) =>
  uploads.map((upload) => upload.status);

test('a kept memo is drawn as saving at once, and sent as a form with its length and its audio', async () => {
  const answer = held();
  const api = fakeApi([answer.reply]);
  const uploads = createUploads({ request: api.request, newId });

  const sending = uploads.keep(KEPT, false);

  assert.deepEqual(statuses(uploads.getState().uploads), ['saving']);

  const [sent] = api.sent;
  assert.equal(sent.path, '/entries/voice');
  assert.equal(sent.method, 'POST');
  assert.equal(sent.form?.get('durationMs'), '72000');

  const file = sent.form?.get(AUDIO_FIELD) as File;
  assert.equal(file.type, 'audio/webm;codecs=opus');
  assert.deepEqual(
    new Uint8Array(await file.arrayBuffer()),
    new Uint8Array([1, 2, 3, 4]),
  );

  answer.release({ kind: 'ok', data: memoEntry('m1') });
  await sending;

  const [saved] = uploads.getState().uploads;
  assert.deepEqual(uploads.getState().uploads, [
    {
      id: saved.id,
      durationMs: 72_000,
      status: 'saved',
      entry: memoEntry('m1'),
    },
  ]);
});

test('a memo the API did not take is kept, and Try again sends the same audio again', async () => {
  const api = fakeApi([NO_ANSWER, SERVER_ERROR, { kind: 'ok', data: memoEntry('m1') }]);
  const uploads = createUploads({ request: api.request, newId });

  await uploads.keep(KEPT, false);
  assert.deepEqual(statuses(uploads.getState().uploads), ['notSaved']);

  const [{ id }] = uploads.getState().uploads;
  await uploads.retry(id);
  assert.deepEqual(statuses(uploads.getState().uploads), ['notSaved']);

  await uploads.retry(id);
  assert.deepEqual(statuses(uploads.getState().uploads), ['saved']);

  const sizes = await Promise.all(
    api.sent.map(async (each) =>
      (each.form?.get(AUDIO_FIELD) as File).size,
    ),
  );
  assert.deepEqual(sizes, [4, 4, 4]);
});

test('a memo is sent kept out of memory or not, as the tick said, as the text "true" or "false"', async () => {
  const api = fakeApi([
    { kind: 'ok', data: memoEntry('m1') },
    { kind: 'ok', data: memoEntry('m2') },
  ]);
  const uploads = createUploads({ request: api.request, newId });

  await uploads.keep(KEPT, false);
  await uploads.keep(KEPT, true);

  assert.deepEqual(
    api.sent.map((each) => each.form?.get('keptOutOfMemory')),
    ['false', 'true'],
  );
});

test('Try again sends the same choice about memory', async () => {
  const api = fakeApi([NO_ANSWER, { kind: 'ok', data: memoEntry('m1') }]);
  const uploads = createUploads({ request: api.request, newId });

  await uploads.keep(KEPT, true);
  const [{ id }] = uploads.getState().uploads;
  await uploads.retry(id);

  assert.deepEqual(
    api.sent.map((each) => each.form?.get('keptOutOfMemory')),
    ['true', 'true'],
  );
});

test('Try again is drawn as saving while it is out, and sends nothing for a memo that is saving or saved', async () => {
  const answer = held();
  const api = fakeApi([NO_ANSWER, answer.reply]);
  const uploads = createUploads({ request: api.request, newId });

  await uploads.keep(KEPT, false);
  const [{ id }] = uploads.getState().uploads;

  const retrying = uploads.retry(id);
  assert.deepEqual(statuses(uploads.getState().uploads), ['saving']);

  await uploads.retry(id);
  assert.equal(api.sent.length, 2);

  answer.release({ kind: 'ok', data: memoEntry('m1') });
  await retrying;
  await uploads.retry(id);
  assert.equal(api.sent.length, 2);
});

test('two memos are sent and kept apart, in the order they were kept', async () => {
  const api = fakeApi([NO_ANSWER, { kind: 'ok', data: memoEntry('m2') }]);
  const uploads = createUploads({ request: api.request, newId });

  await uploads.keep(KEPT, false);
  await uploads.keep({ ...KEPT, durationMs: 5_000 }, false);

  assert.deepEqual(
    uploads.getState().uploads.map((upload) => [upload.durationMs, upload.status]),
    [
      [72_000, 'notSaved'],
      [5_000, 'saved'],
    ],
  );
});

test('an ended session leaves the memo not saved, and signing out clears every memo, even one in flight', async () => {
  const answer = held();
  const api = fakeApi([{ kind: 'ended' }, answer.reply]);
  const uploads = createUploads({ request: api.request, newId });

  await uploads.keep(KEPT, false);
  assert.deepEqual(statuses(uploads.getState().uploads), ['notSaved']);

  const sending = uploads.keep(KEPT, false);
  uploads.clear();
  answer.release({ kind: 'ok', data: memoEntry('m1') });
  await sending;

  assert.deepEqual(uploads.getState().uploads, []);
});

test('forget takes a memo away, and its audio with it', async () => {
  const api = fakeApi([NO_ANSWER]);
  const uploads = createUploads({ request: api.request, newId });

  await uploads.keep(KEPT, false);
  const [{ id }] = uploads.getState().uploads;
  uploads.forget(id);
  await uploads.retry(id);

  assert.deepEqual(uploads.getState().uploads, []);
  assert.equal(api.sent.length, 1);
});

const openDay = (entries: Entry[], date = TODAY): TodayState['day'] => ({
  status: 'open',
  date,
  mood: null,
  entries,
});

test('Today draws memos being sent and not saved, and a saved one only until the day itself shows it', () => {
  const uploads: Upload[] = [
    { id: 'a', durationMs: 1, status: 'saving' },
    { id: 'b', durationMs: 1, status: 'notSaved' },
    { id: 'c', durationMs: 1, status: 'saved', entry: memoEntry('m-c') },
    { id: 'd', durationMs: 1, status: 'saved', entry: memoEntry('m-d') },
    {
      id: 'e',
      durationMs: 1,
      status: 'saved',
      entry: memoEntry('m-e', '2026-10-08'),
    },
  ];

  assert.deepEqual(
    uploadsShownOn(openDay([memoEntry('m-d')]), uploads).map((u) => u.id),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(uploadsShownOn({ status: 'opening' }, uploads), []);
});

/* Today as followUploads sees it: a state, and a look that the test answers. */
function fakeToday(entries: Entry[] = []) {
  let state = { day: openDay(entries), asking: false } as TodayState;
  const listeners = new Set<() => void>();
  let looks = 0;

  const set = (next: Partial<TodayState>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  return {
    today: {
      getState: () => state,
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      async look() {
        looks += 1;
        set({ asking: true });
      },
    },
    looks: () => looks,
    answer: (shown: Entry[], date = TODAY) =>
      set({ asking: false, day: openDay(shown, date) }),
    set,
  };
}

test('a saved memo makes Today ask again once, and is forgotten when the day holds it', async () => {
  const api = fakeApi([{ kind: 'ok', data: memoEntry('m1') }]);
  const uploads = createUploads({ request: api.request, newId });
  const { today, looks, answer } = fakeToday();
  const untie = followUploads(uploads, today);

  await uploads.keep(KEPT, false);
  assert.equal(looks(), 1);
  assert.deepEqual(statuses(uploads.getState().uploads), ['saved']);

  answer([memoEntry('m1')]);
  assert.deepEqual(uploads.getState().uploads, []);
  assert.equal(looks(), 1);

  untie();
});

test('a question already out when the memo is saved is waited for, and then asked again', async () => {
  const api = fakeApi([{ kind: 'ok', data: memoEntry('m1') }]);
  const uploads = createUploads({ request: api.request, newId });
  const fake = fakeToday();
  const untie = followUploads(uploads, fake.today);

  fake.set({ asking: true });
  await uploads.keep(KEPT, false);
  assert.equal(fake.looks(), 0);

  /* That answer left the API before the memo existed. */
  fake.answer([]);
  assert.equal(fake.looks(), 1);
  assert.deepEqual(statuses(uploads.getState().uploads), ['saved']);

  fake.answer([memoEntry('m1')]);
  assert.deepEqual(uploads.getState().uploads, []);

  untie();
});

test('a saved memo the API filed on another day is forgotten, and a memo not yet saved never is', async () => {
  const api = fakeApi([
    NO_ANSWER,
    { kind: 'ok', data: memoEntry('m2', '2026-10-08') },
  ]);
  const uploads = createUploads({ request: api.request, newId });
  const fake = fakeToday();
  const untie = followUploads(uploads, fake.today);

  await uploads.keep(KEPT, false);
  await uploads.keep(KEPT, false);
  fake.answer([]);

  assert.deepEqual(statuses(uploads.getState().uploads), ['notSaved']);

  untie();
});
