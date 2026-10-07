import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ApiResult } from './session.ts';
import { createToday, isBlank, MAX_PAGES, type Request } from './today.ts';

/*
 * A stand-in for the API. It holds a day's entries, answers the four routes
 * Today uses, and can be told to give one route a different answer, or to
 * hold an answer back until the test releases it.
 */
type Reply = ApiResult<unknown>;
type Sent = { method: string; path: string; body?: unknown };

const NO_ANSWER: Reply = { kind: 'unreachable' };
const SERVER_ERROR: Reply = { kind: 'rejected', status: 500, messages: [] };
const ENDED: Reply = { kind: 'ended' };
const NOT_FOUND: Reply = { kind: 'rejected', status: 404, messages: [] };

const entry = (id: string, minute: number) => ({
  id,
  content: `entry ${id}`,
  createdAt: `2026-10-07T09:${String(minute).padStart(2, '0')}:00.000Z`,
});

function held() {
  let release!: (reply: Reply) => void;
  const reply = new Promise<Reply>((resolve) => {
    release = resolve;
  });

  return { reply, release };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

function fakeApi(ids: string[] = []) {
  let stored = ids.map((id, index) => entry(id, index + 1));
  const sent: Sent[] = [];
  const overrides: Record<string, () => Reply | Promise<Reply>> = {};

  const request = (async (path: string, options = {}) => {
    const method = options.method ?? 'GET';
    const key = `${method} ${path.split('?')[0]}`;

    sent.push({ method, path, body: options.body });

    if (overrides[key]) {
      return overrides[key]();
    }

    if (key === 'GET /days/today') {
      return { kind: 'ok', data: { date: '2026-10-07', mood: null } };
    }

    if (key === 'GET /entries') {
      /* Newest first, a page at a time, as the API lists them. */
      const query = new URLSearchParams(path.split('?')[1]);
      const offset = Number(query.get('offset'));
      const limit = Number(query.get('limit'));

      return {
        kind: 'ok',
        data: [...stored].reverse().slice(offset, offset + limit),
      };
    }

    if (key === 'POST /entries') {
      const { content } = options.body as { content: string };
      const created = { ...entry(`new${stored.length}`, 30), content };

      stored = [...stored, created];
      return { kind: 'ok', data: created };
    }

    if (method === 'DELETE') {
      const id = path.split('/')[2];

      stored = stored.filter((item) => item.id !== id);
      return { kind: 'ok', data: undefined };
    }

    throw new Error(`no answer written for ${key}`);
  }) as Request;

  return {
    request,
    sent,
    count: (method: string, start: string) =>
      sent.filter((s) => s.method === method && s.path.startsWith(start))
        .length,
    answer(key: string, reply: () => Reply | Promise<Reply>) {
      overrides[key] = reply;
    },
    restore(key: string) {
      delete overrides[key];
    },
  };
}

async function openToday(ids: string[] = []) {
  const api = fakeApi(ids);
  const today = createToday({ request: api.request, pageSize: 200 });

  await today.open();

  return { api, today };
}

function shown(today: { getState(): { day: unknown } }): string[] {
  const day = today.getState().day as {
    status: string;
    entries?: { id: string }[];
  };

  assert.equal(day.status, 'open');
  return day.entries!.map((item) => item.id);
}

/* ---- Writing ---------------------------------------------------------- */

test('a save that succeeds clears the text, and only after the API has answered', async () => {
  const { api, today } = await openToday();
  const post = held();
  api.answer('POST /entries', () => post.reply);

  today.type('Priya rang.');
  const saving = today.save();
  await settle();

  assert.equal(today.getState().text, 'Priya rang.');
  assert.equal(today.getState().save.status, 'saving');

  post.release({ kind: 'ok', data: entry('x', 30) });
  await saving;

  assert.equal(today.getState().text, '');
  assert.equal(today.getState().save.status, 'idle');
});

for (const [name, reply, why] of [
  ['no answer from the server', NO_ANSWER, 'unreachable'],
  ['a refusal by the server', SERVER_ERROR, 'refused'],
  ['an ended session', ENDED, 'ended'],
] as const) {
  test(`a save that fails with ${name} leaves the text exactly as typed`, async () => {
    const { api, today } = await openToday();
    api.answer('POST /entries', () => reply);

    today.type('  Priya rang.\nWe talked.  ');
    await today.save();

    assert.equal(today.getState().text, '  Priya rang.\nWe talked.  ');
    assert.deepEqual(today.getState().save, { status: 'notSaved', why });
  });
}

test('a 400 is its own reason, and the text is still there', async () => {
  const { api, today } = await openToday();
  api.answer('POST /entries', () => ({
    kind: 'rejected',
    status: 400,
    messages: ['content must contain a non-whitespace character'],
  }));

  today.type('words');
  await today.save();

  assert.equal(today.getState().text, 'words');
  assert.deepEqual(today.getState().save, {
    status: 'notSaved',
    why: 'blank',
  });
});

test('after a failed save, saving is still available and works', async () => {
  const { api, today } = await openToday();
  api.answer('POST /entries', () => NO_ANSWER);

  today.type('words');
  await today.save();

  api.restore('POST /entries');
  await today.save();

  assert.equal(today.getState().text, '');
  assert.equal(api.count('POST', '/entries'), 2);
  assert.equal(shown(today).length, 1);
});

test('two presses while a save is in flight send one request', async () => {
  const { api, today } = await openToday();
  const post = held();
  api.answer('POST /entries', () => post.reply);

  today.type('words');
  const first = today.save();
  const second = today.save();
  await settle();

  assert.equal(api.count('POST', '/entries'), 1);

  post.release({ kind: 'ok', data: entry('x', 30) });
  await first;
  await second;

  assert.equal(api.count('POST', '/entries'), 1);
});

test('text of only spaces and blank lines sends nothing', async () => {
  const { api, today } = await openToday();

  today.type('  \n\n \t ');
  await today.save();

  assert.equal(isBlank('  \n\n \t '), true);
  assert.equal(isBlank(' a '), false);
  assert.equal(api.count('POST', '/entries'), 0);
  assert.equal(today.getState().text, '  \n\n \t ');
  assert.equal(today.getState().save.status, 'idle');
});

test('the body is the contract`s, holding the words without the space around them', async () => {
  const { api, today } = await openToday();

  today.type('  first line\n\nsecond line \n');
  await today.save();

  const post = api.sent.find((s) => s.method === 'POST');
  assert.deepEqual(post?.body, { content: 'first line\n\nsecond line' });
});

test('after a save the entry comes from the API, which is asked for today again', async () => {
  const { api, today } = await openToday(['a']);
  const before = api.count('GET', '/days/today');

  /* The API files it under an id and a time of its own choosing. */
  today.type('words');
  await today.save();

  assert.equal(api.count('GET', '/days/today'), before + 1);
  assert.deepEqual(shown(today), ['a', 'new1']);
});

test('if today cannot be shown again after a save, the screen says the entry was saved', async () => {
  const { api, today } = await openToday();

  today.type('words');
  api.answer('GET /days/today', () => NO_ANSWER);
  await today.save();

  const state = today.getState();
  assert.equal(state.text, '');
  assert.equal(state.save.status, 'saved');
  assert.deepEqual(state.day, { status: 'unreachable', asked: 1 });
});

test('words typed while a save is in flight are not cleared with it', async () => {
  const { api, today } = await openToday();
  const post = held();
  api.answer('POST /entries', () => post.reply);

  today.type('first.');
  const saving = today.save();
  await settle();
  today.type('first. And then more.');

  post.release({ kind: 'ok', data: entry('x', 30) });
  await saving;

  assert.equal(today.getState().text, 'And then more.');
});

/* ---- Deleting --------------------------------------------------------- */

test('asking first changes nothing in the list and sends nothing, and keeping returns to how it was', async () => {
  const { api, today } = await openToday(['a', 'b', 'c']);
  const before = today.getState();

  today.askToDelete('b');

  assert.equal(today.getState().confirming, 'b');
  assert.deepEqual(shown(today), ['a', 'b', 'c']);

  today.keep();

  assert.deepEqual(today.getState(), before);
  assert.equal(api.count('DELETE', '/entries'), 0);
});

test('going ahead without having been asked deletes nothing', async () => {
  const { api, today } = await openToday(['a']);

  await today.goAhead();

  assert.deepEqual(shown(today), ['a']);
  assert.equal(api.count('DELETE', '/entries'), 0);
});

test('a delete removes the entry from the list at once, before any answer', async () => {
  const { api, today } = await openToday(['a', 'b', 'c']);
  const answer = held();
  api.answer('DELETE /entries/b', () => answer.reply);

  today.askToDelete('b');
  const deleting = today.goAhead();

  assert.deepEqual(shown(today), ['a', 'c']);
  assert.equal(today.getState().confirming, null);

  answer.release({ kind: 'ok', data: undefined });
  await deleting;

  assert.deepEqual(shown(today), ['a', 'c']);
  assert.deepEqual(today.getState().notDeleted, {});
});

for (const [name, reply, why] of [
  ['no answer from the server', NO_ANSWER, 'unreachable'],
  ['a refusal by the server', SERVER_ERROR, 'refused'],
] as const) {
  test(`a delete that fails with ${name} puts the entry back at the same position, among the same neighbours`, async () => {
    const { api, today } = await openToday(['a', 'b', 'c']);
    api.answer('DELETE /entries/b', () => reply);

    today.askToDelete('b');
    await today.goAhead();

    assert.deepEqual(shown(today), ['a', 'b', 'c']);
    assert.deepEqual(today.getState().notDeleted, { b: why });
  });
}

test('a delete answered with 404 leaves the entry gone, and nothing is said', async () => {
  const { api, today } = await openToday(['a', 'b', 'c']);
  api.answer('DELETE /entries/b', () => NOT_FOUND);

  today.askToDelete('b');
  await today.goAhead();

  assert.deepEqual(shown(today), ['a', 'c']);
  assert.deepEqual(today.getState().notDeleted, {});
});

test('of two entries deleted one after the other, where only the first fails, the first returns and the second stays gone', async () => {
  const { api, today } = await openToday(['a', 'b', 'c', 'd']);
  const first = held();
  api.answer('DELETE /entries/b', () => first.reply);

  today.askToDelete('b');
  const deletingB = today.goAhead();
  today.askToDelete('c');
  const deletingC = today.goAhead();

  assert.deepEqual(shown(today), ['a', 'd']);

  await deletingC;
  first.release(NO_ANSWER);
  await deletingB;

  assert.deepEqual(shown(today), ['a', 'b', 'd']);
  assert.deepEqual(today.getState().notDeleted, { b: 'unreachable' });
});

test('deleting the last entry of today leaves an open day with nothing in it', async () => {
  const { today } = await openToday(['a']);

  today.askToDelete('a');
  await today.goAhead();

  assert.deepEqual(shown(today), []);
});

test('an answer that left the API before the delete does not bring the entry back', async () => {
  const { api, today } = await openToday(['a', 'b']);
  const stale = held();
  api.answer('GET /entries', () => stale.reply);

  const looking = today.look();
  await settle();

  today.askToDelete('b');
  await today.goAhead();

  stale.release({ kind: 'ok', data: [entry('b', 2), entry('a', 1)] });
  await looking;

  assert.deepEqual(shown(today), ['a']);
});

test('pressing delete again on an entry that came back takes its sentence away', async () => {
  const { api, today } = await openToday(['a']);
  api.answer('DELETE /entries/a', () => NO_ANSWER);

  today.askToDelete('a');
  await today.goAhead();
  assert.deepEqual(today.getState().notDeleted, { a: 'unreachable' });

  api.restore('DELETE /entries/a');
  today.askToDelete('a');
  await today.goAhead();

  assert.deepEqual(today.getState().notDeleted, {});
  assert.deepEqual(shown(today), []);
});

test('an entry that came back can be kept, and its sentence leaves without anything being sent', async () => {
  const { api, today } = await openToday(['a', 'b']);
  api.answer('DELETE /entries/a', () => NO_ANSWER);

  today.askToDelete('a');
  await today.goAhead();
  assert.deepEqual(today.getState().notDeleted, { a: 'unreachable' });

  today.dismiss('a');

  assert.deepEqual(today.getState().notDeleted, {});
  assert.deepEqual(shown(today), ['a', 'b']);
  assert.equal(api.count('DELETE', '/entries'), 1);
});

test('trying again after a failed delete asks first, and keeping then leaves no sentence behind', async () => {
  const { api, today } = await openToday(['a']);
  api.answer('DELETE /entries/a', () => NO_ANSWER);

  today.askToDelete('a');
  await today.goAhead();

  today.askToDelete('a');

  assert.equal(today.getState().confirming, 'a');
  assert.deepEqual(today.getState().notDeleted, {});
  assert.equal(api.count('DELETE', '/entries'), 1);

  today.keep();

  assert.equal(today.getState().confirming, null);
  assert.deepEqual(today.getState().notDeleted, {});
  assert.deepEqual(shown(today), ['a']);
});

/* ---- Asking ----------------------------------------------------------- */

test('asking again says so while it asks, and counts the question when the answer is the same', async () => {
  const api = fakeApi();
  const today = createToday({ request: api.request, pageSize: 200 });
  api.answer('GET /days/today', () => NO_ANSWER);

  await today.open();
  assert.deepEqual(today.getState().day, { status: 'unreachable', asked: 1 });

  const again = held();
  api.answer('GET /days/today', () => again.reply);

  const press = today.open();
  const secondPress = today.open();
  await settle();

  assert.equal(today.getState().asking, true);
  assert.equal(api.count('GET', '/days/today'), 2);

  again.release(NO_ANSWER);
  await press;
  await secondPress;

  assert.equal(today.getState().asking, false);
  assert.deepEqual(today.getState().day, { status: 'unreachable', asked: 2 });

  api.restore('GET /days/today');
  await today.open();
  assert.equal(today.getState().day.status, 'open');
});

test('looking again keeps the day on the screen when the answer is not a good one', async () => {
  const { api, today } = await openToday(['a']);
  api.answer('GET /days/today', () => NO_ANSWER);

  await today.look();

  assert.deepEqual(shown(today), ['a']);
});

test('a day is read oldest first, across more than one page', async () => {
  const api = fakeApi(['a', 'b', 'c']);
  const today = createToday({ request: api.request, pageSize: 3 });

  await today.open();

  assert.deepEqual(shown(today), ['a', 'b', 'c']);
  assert.equal(api.count('GET', '/entries'), 2);
});

test('of two questions in flight, the answer to the older one is thrown away when it arrives last', async () => {
  const { api, today } = await openToday(['a']);
  const older = held();

  /* Only the first question is held. The one after it is answered at once. */
  api.answer('GET /entries', () => {
    api.restore('GET /entries');
    return older.reply;
  });

  const looking = today.look();
  await settle();

  /* A save asks its own question, whatever is already in flight. */
  today.type('words');
  await today.save();

  assert.deepEqual(shown(today), ['a', 'new1']);

  /* The older answer left the API before the entry existed. */
  older.release({ kind: 'ok', data: [entry('a', 1)] });
  await looking;

  assert.deepEqual(shown(today), ['a', 'new1']);
  assert.equal(today.getState().asking, false);
});

test('an API that never sends a short page is asked a counted number of times, and no more', async () => {
  const api = fakeApi();
  const today = createToday({ request: api.request, pageSize: 2 });

  api.answer('GET /entries', () => {
    const asked = api.count('GET', '/entries');

    return {
      kind: 'ok',
      data: [entry(`p${asked}a`, 1), entry(`p${asked}b`, 2)],
    };
  });

  await today.open();

  assert.equal(api.count('GET', '/entries'), MAX_PAGES);
  assert.deepEqual(today.getState().day, { status: 'failed', asked: 1 });
});
