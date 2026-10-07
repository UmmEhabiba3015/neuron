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

function fakeApi(ids: string[] = [], mood: string | null = null) {
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
      return { kind: 'ok', data: { date: '2026-10-07', mood } };
    }

    if (key === 'PUT /days/2026-10-07/mood') {
      mood = (options.body as { mood: string | null }).mood;
      return { kind: 'ok', data: { date: '2026-10-07', mood } };
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

async function openToday(ids: string[] = [], mood: string | null = null) {
  const api = fakeApi(ids, mood);
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

/* ---- Mood ------------------------------------------------------------- */

const PUT_MOOD = 'PUT /days/2026-10-07/mood';

function moodOf(today: { getState(): { day: unknown } }): string | null {
  const day = today.getState().day as { status: string; mood: string | null };

  assert.equal(day.status, 'open');
  return day.mood;
}

/* The moods the API was sent, in the order it was sent them. */
function moodsSent(api: { sent: Sent[] }): (string | null)[] {
  return api.sent
    .filter((s) => s.method === 'PUT')
    .map((s) => (s.body as { mood: string | null }).mood);
}

test('the mood the API reports for the day is the one shown when today opens', async () => {
  assert.equal(moodOf((await openToday(['a'], 'Low')).today), 'Low');
  assert.equal(moodOf((await openToday(['a'], null)).today), null);
});

test('a pressed word is marked at once, before the API has answered, and is sent for the day on the screen', async () => {
  const { api, today } = await openToday(['a']);
  const put = held();
  api.answer(PUT_MOOD, () => put.reply);

  const pressing = today.pressMood('Good');

  assert.equal(moodOf(today), 'Good');
  assert.deepEqual(api.sent.at(-1), {
    method: 'PUT',
    path: '/days/2026-10-07/mood',
    body: { mood: 'Good' },
  });

  put.release({ kind: 'ok', data: { date: '2026-10-07', mood: 'Good' } });
  await pressing;

  assert.equal(moodOf(today), 'Good');
  assert.equal(today.getState().moodNotSaved, null);
});

test('pressing the chosen word a second time clears the mood: null is sent, and no word is shown, at once', async () => {
  const { api, today } = await openToday(['a'], 'Good');
  const put = held();
  api.answer(PUT_MOOD, () => put.reply);

  const pressing = today.pressMood('Good');

  assert.equal(moodOf(today), null);
  assert.deepEqual(moodsSent(api), [null]);

  put.release({ kind: 'ok', data: { date: '2026-10-07', mood: null } });
  await pressing;

  assert.equal(moodOf(today), null);
});

test('pressing another word changes the mood and does not clear it', async () => {
  const { api, today } = await openToday(['a'], 'Good');

  await today.pressMood('Low');

  assert.equal(moodOf(today), 'Low');
  assert.deepEqual(moodsSent(api), ['Low']);
});

for (const [reply, why] of [
  [NO_ANSWER, 'unreachable'],
  [SERVER_ERROR, 'refused'],
  [NOT_FOUND, 'refused'],
] as const) {
  test(`a mood that fails (${reply.kind}${'status' in reply ? ` ${reply.status}` : ''}) goes back to what it was, and says why`, async () => {
    const { api, today } = await openToday(['a'], 'Good');
    const put = held();
    api.answer(PUT_MOOD, () => put.reply);

    const pressing = today.pressMood('Low');
    assert.equal(moodOf(today), 'Low');

    put.release(reply);
    await pressing;

    assert.equal(moodOf(today), 'Good');
    assert.equal(today.getState().moodNotSaved, why);
  });
}

test('a mood that fails on a day with none goes back to none, and a clear that fails goes back to the word', async () => {
  const none = await openToday(['a'], null);
  none.api.answer(PUT_MOOD, () => NO_ANSWER);
  await none.today.pressMood('Hard');
  assert.equal(moodOf(none.today), null);

  const some = await openToday(['a'], 'Hard');
  some.api.answer(PUT_MOOD, () => NO_ANSWER);
  await some.today.pressMood('Hard');
  assert.equal(moodOf(some.today), 'Hard');
  assert.equal(some.today.getState().moodNotSaved, 'unreachable');
});

test('the next press takes the sentence of a failed mood away, and can succeed', async () => {
  const { api, today } = await openToday(['a']);
  api.answer(PUT_MOOD, () => NO_ANSWER);
  await today.pressMood('Even');
  assert.equal(today.getState().moodNotSaved, 'unreachable');

  api.restore(PUT_MOOD);
  const pressing = today.pressMood('Even');
  assert.equal(today.getState().moodNotSaved, null);
  await pressing;

  assert.equal(moodOf(today), 'Even');
  assert.equal(today.getState().moodNotSaved, null);
});

test('a session that ended while a mood was being sent leaves no sentence', async () => {
  const { api, today } = await openToday(['a']);
  api.answer(PUT_MOOD, () => ENDED);

  await today.pressMood('Even');

  assert.equal(today.getState().moodNotSaved, null);
});

/*
 * Two presses, Good and then Low, with the first request still out. The four
 * tests below are the four ways the two requests can end.
 */
async function goodThenLow(first: Reply, second: Reply) {
  const { api, today } = await openToday(['a'], 'Even');
  const replies = [held(), held()];
  let asked = 0;
  api.answer(PUT_MOOD, () => replies[asked++].reply);

  const good = today.pressMood('Good');
  const low = today.pressMood('Low');

  /* The second word is marked at once, though its request has not left. */
  assert.equal(moodOf(today), 'Low');
  assert.deepEqual(moodsSent(api), ['Good']);

  replies[0].release(first);
  await settle();

  /* The answer to the older press changes nothing on the screen. */
  assert.equal(moodOf(today), 'Low');
  assert.equal(today.getState().moodNotSaved, null);
  assert.deepEqual(moodsSent(api), ['Good', 'Low']);

  replies[1].release(second);
  await Promise.all([good, low]);

  return today;
}

const SAVED: Reply = { kind: 'ok', data: {} };

test('the last press wins: of Good and then Low, the row ends on Low, and the API is sent them in the order they were pressed', async () => {
  const today = await goodThenLow(SAVED, SAVED);

  assert.equal(moodOf(today), 'Low');
  assert.equal(today.getState().moodNotSaved, null);
});

test('the last press wins: when the first request fails and the second succeeds, the row stays on Low and nothing is undone or said', async () => {
  for (const failure of [NO_ANSWER, SERVER_ERROR]) {
    const today = await goodThenLow(failure, SAVED);

    assert.equal(moodOf(today), 'Low');
    assert.equal(today.getState().moodNotSaved, null);
  }
});

test('when the first request succeeds and the second fails, the row goes back to Good, which is what the API holds', async () => {
  const today = await goodThenLow(SAVED, NO_ANSWER);

  assert.equal(moodOf(today), 'Good');
  assert.equal(today.getState().moodNotSaved, 'unreachable');
});

test('when both requests fail, the row goes back to the mood from before both presses', async () => {
  const today = await goodThenLow(NO_ANSWER, SERVER_ERROR);

  assert.equal(moodOf(today), 'Even');
  assert.equal(today.getState().moodNotSaved, 'refused');
});

test('of several presses made while one request is out, only the last is sent after it', async () => {
  const { api, today } = await openToday(['a']);
  const first = held();
  api.answer(PUT_MOOD, () => first.reply);

  const presses = [
    today.pressMood('Light'),
    today.pressMood('Good'),
    today.pressMood('Even'),
    today.pressMood('Hard'),
  ];

  assert.equal(moodOf(today), 'Hard');

  api.restore(PUT_MOOD);
  first.release(SAVED);
  await Promise.all(presses);
  await settle();

  assert.deepEqual(moodsSent(api), ['Light', 'Hard']);
  assert.equal(moodOf(today), 'Hard');
});

test('the same word pressed twice in a row is set and then cleared, even while the first request is out', async () => {
  const { api, today } = await openToday(['a']);
  const first = held();
  api.answer(PUT_MOOD, () => first.reply);

  const presses = [today.pressMood('Good'), today.pressMood('Good')];
  assert.equal(moodOf(today), null);

  api.restore(PUT_MOOD);
  first.release(SAVED);
  await Promise.all(presses);
  await settle();

  assert.deepEqual(moodsSent(api), ['Good', null]);
  assert.equal(moodOf(today), null);
});

test('an answer about today that left the API before the mood was saved does not undo the mood', async () => {
  const { api, today } = await openToday(['a']);
  const old = held();
  api.answer('GET /days/today', () => old.reply);

  const looking = today.look();
  await settle();
  await today.pressMood('Good');

  old.release({ kind: 'ok', data: { date: '2026-10-07', mood: null } });
  await looking;

  assert.equal(moodOf(today), 'Good');
});

test('an answer about today that was asked for after the mood was saved is believed', async () => {
  const { api, today } = await openToday(['a']);
  await today.pressMood('Good');

  /* Another tab has changed it since. */
  api.answer('GET /days/today', () => ({
    kind: 'ok',
    data: { date: '2026-10-07', mood: 'Hard' },
  }));
  await today.look();

  assert.equal(moodOf(today), 'Hard');
});

test('a press before today has opened sends nothing', async () => {
  const api = fakeApi(['a']);
  const today = createToday({ request: api.request, pageSize: 200 });

  await today.pressMood('Good');

  assert.equal(api.sent.length, 0);
});
