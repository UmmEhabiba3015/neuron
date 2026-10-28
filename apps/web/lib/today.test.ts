import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EntryKind, Mood, type Entry } from '@neuron/contracts';
import type { ApiResult } from './api/session.ts';
import {
  createPastDay,
  createToday,
  isBlank,
  MAX_PAGES,
  scrollsToBottom,
  type Request,
  type TodayState,
} from './today.ts';

/*
 * A stand-in for the API. It holds entries, each filed on a date, answers
 * the routes a day's page uses, and can be told to give one route a
 * different answer, or to hold an answer back until the test releases it.
 *
 * Its today is TODAY. Entries are on TODAY unless `file` puts them elsewhere.
 */
const TODAY = '2026-10-07';
type Reply = ApiResult<unknown>;
type Sent = { method: string; path: string; body?: unknown };

const NO_ANSWER: Reply = { kind: 'unreachable' };
const SERVER_ERROR: Reply = { kind: 'rejected', status: 500, messages: [] };
const ENDED: Reply = { kind: 'ended' };
const NOT_FOUND: Reply = { kind: 'rejected', status: 404, messages: [] };

const entry = (id: string, minute: number, date = TODAY): Entry => ({
  id,
  kind: EntryKind.Text,
  content: `entry ${id}`,
  durationMs: null,
  createdAt: `${date}T09:${String(minute).padStart(2, '0')}:00.000Z`,
  date,
  keptOutOfMemory: false,
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
  const moods: Record<string, string | null> = { [TODAY]: mood };
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
      return { kind: 'ok', data: { date: TODAY, mood: moods[TODAY] } };
    }

    const day = /^(GET|PUT) \/days\/(\d{4}-\d{2}-\d{2})(\/mood)?$/.exec(key);

    if (day && day[1] === 'PUT' && day[3]) {
      moods[day[2]] = (options.body as { mood: string | null }).mood;
      return { kind: 'ok', data: { date: day[2], mood: moods[day[2]] } };
    }

    if (day && day[1] === 'GET' && !day[3]) {
      return { kind: 'ok', data: { date: day[2], mood: moods[day[2]] ?? null } };
    }

    if (key === 'GET /entries') {
      /* Newest first, a page at a time, as the API lists them. */
      const query = new URLSearchParams(path.split('?')[1]);
      const offset = Number(query.get('offset'));
      const limit = Number(query.get('limit'));
      const on = query.get('date');

      return {
        kind: 'ok',
        data: stored
          .filter((item) => on === null || item.date === on)
          .reverse()
          .slice(offset, offset + limit),
      };
    }

    if (key === 'POST /entries') {
      const { content, keptOutOfMemory = false } = options.body as {
        content: string;
        keptOutOfMemory?: boolean;
      };
      const created = {
        ...entry(`new${stored.length}`, 30),
        content,
        keptOutOfMemory,
      };

      stored = [...stored, created];
      return { kind: 'ok', data: created };
    }

    if (method === 'PATCH') {
      const id = path.split('/')[2];
      const { content } = options.body as { content: string };
      const found = stored.find((item) => item.id === id);

      if (!found) {
        return NOT_FOUND;
      }

      const changed = { ...found, content };

      stored = stored.map((item) => (item.id === id ? changed : item));
      return { kind: 'ok', data: changed };
    }

    const memory = /^PUT \/entries\/([^/]+)\/memory$/.exec(key);

    if (memory) {
      const found = stored.find((item) => item.id === memory[1]);

      if (!found) {
        return NOT_FOUND;
      }

      const changed = { ...found, keptOutOfMemory: false };

      stored = stored.map((item) => (item.id === found.id ? changed : item));
      return { kind: 'ok', data: changed };
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
    /* Marks stored entries as kept out of memory, as if saved with the tick. */
    keepOut(...keptOut: string[]) {
      stored = stored.map((item) =>
        keptOut.includes(item.id) ? { ...item, keptOutOfMemory: true } : item,
      );
    },
    /* Puts entries on another date, and gives that day a mood. */
    file(date: string, others: string[], felt: string | null = null) {
      stored = [
        ...stored,
        ...others.map((id, index) => entry(id, index + 1, date)),
      ];
      moods[date] = felt;
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
  assert.deepEqual(post?.body, {
    content: 'first line\n\nsecond line',
    keptOutOfMemory: false,
  });
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

  const pressing = today.pressMood(Mood.Good);

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

  const pressing = today.pressMood(Mood.Good);

  assert.equal(moodOf(today), null);
  assert.deepEqual(moodsSent(api), [null]);

  put.release({ kind: 'ok', data: { date: '2026-10-07', mood: null } });
  await pressing;

  assert.equal(moodOf(today), null);
});

test('pressing another word changes the mood and does not clear it', async () => {
  const { api, today } = await openToday(['a'], 'Good');

  await today.pressMood(Mood.Low);

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

    const pressing = today.pressMood(Mood.Low);
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
  await none.today.pressMood(Mood.Hard);
  assert.equal(moodOf(none.today), null);

  const some = await openToday(['a'], 'Hard');
  some.api.answer(PUT_MOOD, () => NO_ANSWER);
  await some.today.pressMood(Mood.Hard);
  assert.equal(moodOf(some.today), 'Hard');
  assert.equal(some.today.getState().moodNotSaved, 'unreachable');
});

test('the next press takes the sentence of a failed mood away, and can succeed', async () => {
  const { api, today } = await openToday(['a']);
  api.answer(PUT_MOOD, () => NO_ANSWER);
  await today.pressMood(Mood.Even);
  assert.equal(today.getState().moodNotSaved, 'unreachable');

  api.restore(PUT_MOOD);
  const pressing = today.pressMood(Mood.Even);
  assert.equal(today.getState().moodNotSaved, null);
  await pressing;

  assert.equal(moodOf(today), 'Even');
  assert.equal(today.getState().moodNotSaved, null);
});

test('a session that ended while a mood was being sent leaves no sentence', async () => {
  const { api, today } = await openToday(['a']);
  api.answer(PUT_MOOD, () => ENDED);

  await today.pressMood(Mood.Even);

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

  const good = today.pressMood(Mood.Good);
  const low = today.pressMood(Mood.Low);

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
    today.pressMood(Mood.Light),
    today.pressMood(Mood.Good),
    today.pressMood(Mood.Even),
    today.pressMood(Mood.Hard),
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

  const presses = [today.pressMood(Mood.Good), today.pressMood(Mood.Good)];
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
  await today.pressMood(Mood.Good);

  old.release({ kind: 'ok', data: { date: '2026-10-07', mood: null } });
  await looking;

  assert.equal(moodOf(today), 'Good');
});

test('an answer about today that was asked for after the mood was saved is believed', async () => {
  const { api, today } = await openToday(['a']);
  await today.pressMood(Mood.Good);

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

  await today.pressMood(Mood.Good);

  assert.equal(api.sent.length, 0);
});

/* ---- The page of a date that is not today ------------------------------ */

const PAST = '2026-08-06';
const PUT_PAST_MOOD = `PUT /days/${PAST}/mood`;

async function openPast(
  ids: string[] = ['a', 'b'],
  mood: string | null = null,
  date = PAST,
) {
  const api = fakeApi(['today1']);
  api.file(PAST, ids, mood);

  const page = createPastDay({ request: api.request, pageSize: 200, date });

  await page.open();

  return { api, page };
}

const statusOf = (page: { getState(): { day: { status: string } } }) =>
  page.getState().day.status;

test('the page of a past date opens with that day`s entries, oldest first, and no other day`s', async () => {
  const { api, page } = await openPast(['a', 'b', 'c']);

  assert.deepEqual(shown(page), ['a', 'b', 'c']);
  assert.equal(
    (page.getState().day as { date: string }).date,
    PAST,
    'the date shown is the one the API answered with',
  );
  assert.deepEqual(
    api.sent.map((s) => s.path),
    ['/days/today', `/days/${PAST}`, `/entries?date=${PAST}&limit=200&offset=0`],
  );
});

test('the page of a past date shows the mood the API holds for that day, and not today`s', async () => {
  const api = fakeApi(['today1'], 'Hard');
  api.file(PAST, ['a'], 'Low');

  const page = createPastDay({ request: api.request, pageSize: 200, date: PAST });
  await page.open();

  assert.equal(moodOf(page), 'Low');
});

test('a mood pressed on a past date is marked at once and is sent for that date, in the contract`s shape', async () => {
  const { api, page } = await openPast(['a'], 'Low');
  const put = held();
  api.answer(PUT_PAST_MOOD, () => put.reply);

  const pressing = page.pressMood(Mood.Good);
  assert.equal(moodOf(page), 'Good', 'before any answer');

  put.release({ kind: 'ok', data: { date: PAST, mood: 'Good' } });
  await pressing;

  api.restore(PUT_PAST_MOOD);
  await page.pressMood(Mood.Good);

  const puts = api.sent.filter((s) => s.method === 'PUT');

  assert.deepEqual(
    puts.map((s) => s.path),
    [`/days/${PAST}/mood`, `/days/${PAST}/mood`],
  );

  /* Exactly one field, named mood: a word, and null to clear it. */
  assert.deepEqual(
    puts.map((s) => s.body),
    [{ mood: 'Good' }, { mood: null }],
  );
  assert.equal(moodOf(page), null);
});

test('a mood that fails on a past date goes back to what the API holds, with its reason', async () => {
  const { api, page } = await openPast(['a'], 'Low');
  api.answer(PUT_PAST_MOOD, () => NO_ANSWER);

  await page.pressMood(Mood.Good);

  assert.equal(moodOf(page), 'Low');
  assert.equal(page.getState().moodNotSaved, 'unreachable');
});

test('an entry of a past date is deleted as on Today: asked first, gone at once, and sent for that entry', async () => {
  const { api, page } = await openPast(['a', 'b']);
  const del = held();
  api.answer('DELETE /entries/a', () => del.reply);

  page.askToDelete('a');
  assert.deepEqual(shown(page), ['a', 'b'], 'asking deletes nothing');

  const going = page.goAhead();
  assert.deepEqual(shown(page), ['b'], 'before any answer');

  del.release({ kind: 'ok', data: undefined });
  await going;

  assert.deepEqual(shown(page), ['b']);
  assert.equal(api.count('DELETE', '/entries/a'), 1);
});

for (const [name, reply, why] of [
  ['gets no answer', NO_ANSWER, 'unreachable'],
  ['is refused', SERVER_ERROR, 'refused'],
] as const) {
  test(`a delete on a past date that ${name} puts the entry back where it was, with its reason`, async () => {
    const { api, page } = await openPast(['a', 'b', 'c']);
    api.answer('DELETE /entries/b', () => reply);

    page.askToDelete('b');
    await page.goAhead();

    assert.deepEqual(shown(page), ['a', 'b', 'c']);
    assert.deepEqual(page.getState().notDeleted, { b: why });
  });
}

test('the page of a past date cannot write: it has no save and no type, and sends no entry', async () => {
  const { api, page } = await openPast();

  assert.equal('save' in page, false);
  assert.equal('type' in page, false);
  assert.equal('toggleKeepOut' in page, false);
  assert.equal(api.count('POST', '/entries'), 0);
});

for (const address of [
  'yesterday',
  '2026-8-6',
  '2026-02-31',
  '2026-13-01',
  '2026-08-06x',
  ' 2026-08-06',
  '',
]) {
  test(`an address that is not a calendar date is not found, and nothing is asked: "${address}"`, async () => {
    const { api, page } = await openPast(['a'], null, address);

    assert.equal(statusOf(page), 'notFound');

    await page.look();
    assert.deepEqual(api.sent, []);
  });
}

test('a day the API answers 404 for is not found, whatever the message says', async () => {
  for (const messages of [[], ['Day with date 2027-01-01 not found'], ['x', 'y']]) {
    const api = fakeApi();
    api.answer('GET /days/2027-01-01', () => ({
      kind: 'rejected',
      status: 404,
      messages,
    }));

    const page = createPastDay({
      request: api.request,
      pageSize: 200,
      date: '2027-01-01',
    });
    await page.open();

    assert.equal(statusOf(page), 'notFound');
    assert.equal(api.count('GET', '/entries'), 0);
  }
});

test('a day that has no entries is not found', async () => {
  const { page } = await openPast([]);

  assert.equal(statusOf(page), 'notFound');
});

test('a failure to reach the server is not shown as not found, and neither is a failure on our side', async () => {
  for (const [key, reply, status] of [
    ['GET /days/today', NO_ANSWER, 'unreachable'],
    [`GET /days/${PAST}`, NO_ANSWER, 'unreachable'],
    ['GET /entries', NO_ANSWER, 'unreachable'],
    [`GET /days/${PAST}`, SERVER_ERROR, 'failed'],
    ['GET /entries', SERVER_ERROR, 'failed'],
  ] as const) {
    const api = fakeApi();
    api.file(PAST, ['a']);
    api.answer(key, () => reply);

    const page = createPastDay({ request: api.request, pageSize: 200, date: PAST });
    await page.open();

    assert.equal(statusOf(page), status, key);

    /* And asking again, once the server answers, opens the day. */
    api.restore(key);
    await page.open();
    assert.deepEqual(shown(page), ['a'], key);
  }
});

test('a session that ends while a past date is opening is neither not found nor a failure', async () => {
  const api = fakeApi();
  api.file(PAST, ['a']);
  api.answer(`GET /days/${PAST}`, () => ENDED);

  const page = createPastDay({ request: api.request, pageSize: 200, date: PAST });
  await page.open();

  assert.equal(statusOf(page), 'opening');
});

test('the address of today`s own date says so, and asks for no entries', async () => {
  const { api, page } = await openPast(['a'], null, TODAY);

  assert.equal(statusOf(page), 'isToday');
  assert.deepEqual(
    api.sent.map((s) => s.path),
    ['/days/today'],
  );
});

test('deleting the last entry of a past date leaves a day that says it was emptied, which is not the same as not found', async () => {
  const { page } = await openPast(['a']);

  page.askToDelete('a');
  const going = page.goAhead();

  assert.deepEqual(page.getState().day, { status: 'emptied', date: PAST });

  await going;
  assert.deepEqual(page.getState().day, { status: 'emptied', date: PAST });

  /* Looked at again, the API now has nothing on that day, and it stays so. */
  await page.look();
  assert.deepEqual(page.getState().day, { status: 'emptied', date: PAST });
});

test('when the delete of the last entry of a past date fails, the entry and the day come back', async () => {
  const { api, page } = await openPast(['a'], 'Low');
  api.answer('DELETE /entries/a', () => NO_ANSWER);

  page.askToDelete('a');
  await page.goAhead();

  assert.deepEqual(shown(page), ['a']);
  assert.equal(moodOf(page), 'Low');
  assert.deepEqual(page.getState().notDeleted, { a: 'unreachable' });
});

/* ---- Editing an entry -------------------------------------------------- */

const contentOf = (
  page: { getState(): { day: unknown } },
  id: string,
): string | undefined =>
  (
    page.getState().day as { entries?: { id: string; content: string }[] }
  ).entries?.find((item) => item.id === id)?.content;

test('opening the editor holds the entry`s words, and sends nothing', async () => {
  const { api, today } = await openToday(['a', 'b']);
  const before = api.sent.length;

  today.edit('b');

  assert.deepEqual(today.getState().editing, {
    id: 'b',
    text: 'entry b',
    save: { status: 'idle' },
  });
  assert.equal(api.sent.length, before);
});

test('a voice memo has no editor: pressing edit on one opens nothing and sends nothing', async () => {
  const api = fakeApi();
  const memo: Entry = {
    id: 'm',
    kind: EntryKind.Voice,
    content: null,
    durationMs: 72_000,
    createdAt: `${TODAY}T09:05:00.000Z`,
    date: TODAY,
    keptOutOfMemory: false,
  };
  api.answer('GET /entries', () => ({ kind: 'ok', data: [memo] }));
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();
  const before = api.sent.length;

  today.edit('m');
  await today.saveEdit();

  assert.equal(today.getState().editing, null);
  assert.equal(api.sent.length, before);
  assert.deepEqual(shown(today), ['m']);
});

test('saving sends PATCH for that entry, in the contract`s shape, with the words without the space around them', async () => {
  const { api, today } = await openToday(['a']);

  today.edit('a');
  today.typeEdit('  changed words \n');
  await today.saveEdit();

  const patches = api.sent.filter((s) => s.method === 'PATCH');

  assert.deepEqual(patches, [
    { method: 'PATCH', path: '/entries/a', body: { content: 'changed words' } },
  ]);
});

test('the editor stays open with the new words, saying it is saving, until the API answers; then it closes on the saved words', async () => {
  const { api, today } = await openToday(['a']);
  const patch = held();
  api.answer('PATCH /entries/a', () => patch.reply);

  today.edit('a');
  today.typeEdit('new words');
  const saving = today.saveEdit();

  assert.deepEqual(today.getState().editing, {
    id: 'a',
    text: 'new words',
    save: { status: 'saving' },
  });
  assert.equal(contentOf(today, 'a'), 'entry a', 'not shown before the answer');

  patch.release({
    kind: 'ok',
    data: { ...entry('a', 1), content: 'new words' },
  });
  await saving;

  assert.equal(today.getState().editing, null);
  assert.equal(contentOf(today, 'a'), 'new words');
});

test('the edited entry keeps its time, its place and its day, and the day is not asked for again', async () => {
  const { api, today } = await openToday(['a', 'b', 'c']);
  const before = api.count('GET', '/entries');

  today.edit('b');
  today.typeEdit('changed');
  await today.saveEdit();

  assert.deepEqual(shown(today), ['a', 'b', 'c']);
  const day = today.getState().day as unknown as {
    entries: { createdAt: string }[];
  };
  assert.equal(day.entries[1].createdAt, entry('b', 2).createdAt);
  assert.equal(api.count('GET', '/entries'), before);
});

test('two presses while an edit is being saved send one request', async () => {
  const { api, today } = await openToday(['a']);
  const patch = held();
  api.answer('PATCH /entries/a', () => patch.reply);

  today.edit('a');
  today.typeEdit('once');
  const first = today.saveEdit();
  const second = today.saveEdit();

  patch.release({ kind: 'ok', data: { ...entry('a', 1), content: 'once' } });
  await Promise.all([first, second]);

  assert.equal(api.count('PATCH', '/entries'), 1);
});

test('blank words are refused before anything is sent, and the editor stays open', async () => {
  const { api, today } = await openToday(['a']);

  today.edit('a');
  today.typeEdit('  \n\n ');
  await today.saveEdit();

  assert.equal(api.count('PATCH', '/entries'), 0);
  assert.deepEqual(today.getState().editing, {
    id: 'a',
    text: '  \n\n ',
    save: { status: 'notSaved', why: 'blank' },
  });
  assert.equal(contentOf(today, 'a'), 'entry a');
});

for (const [name, reply, why] of [
  ['no answer', NO_ANSWER, 'unreachable'],
  ['a server error', SERVER_ERROR, 'refused'],
] as const) {
  test(`an edit that fails with ${name} keeps the editor open with the changed words, and says why`, async () => {
    const { api, today } = await openToday(['a']);
    api.answer('PATCH /entries/a', () => reply);

    today.edit('a');
    today.typeEdit('changed words');
    await today.saveEdit();

    assert.deepEqual(today.getState().editing, {
      id: 'a',
      text: 'changed words',
      save: { status: 'notSaved', why },
    });
    assert.equal(contentOf(today, 'a'), 'entry a');
  });
}

test('after a failed edit, saving again works, and typing takes the sentence away', async () => {
  const { api, today } = await openToday(['a']);
  api.answer('PATCH /entries/a', () => NO_ANSWER);

  today.edit('a');
  today.typeEdit('changed');
  await today.saveEdit();

  today.typeEdit('changed again');
  assert.deepEqual(today.getState().editing?.save, { status: 'idle' });

  api.restore('PATCH /entries/a');
  await today.saveEdit();

  assert.equal(today.getState().editing, null);
  assert.equal(contentOf(today, 'a'), 'changed again');
});

test('an edit whose session has ended keeps the words and says nothing', async () => {
  const { api, today } = await openToday(['a']);
  api.answer('PATCH /entries/a', () => ENDED);

  today.edit('a');
  today.typeEdit('changed');
  await today.saveEdit();

  assert.deepEqual(today.getState().editing, {
    id: 'a',
    text: 'changed',
    save: { status: 'idle' },
  });
});

test('an edit answered 404 removes the entry from the page and says so', async () => {
  const { api, today } = await openToday(['a', 'b']);
  api.answer('PATCH /entries/a', () => NOT_FOUND);

  today.edit('a');
  today.typeEdit('too late');
  await today.saveEdit();

  assert.deepEqual(shown(today), ['b']);
  assert.equal(today.getState().editing, null);
  assert.equal(today.getState().editedGone, true);

  today.edit('b');
  assert.equal(today.getState().editedGone, false, 'the next edit takes it away');
});

test('cancelling closes the editor, puts back the words, and sends nothing', async () => {
  const { api, today } = await openToday(['a']);
  const before = api.sent.length;

  today.edit('a');
  today.typeEdit('not wanted');
  today.cancelEdit();

  assert.equal(today.getState().editing, null);
  assert.equal(contentOf(today, 'a'), 'entry a');
  assert.equal(api.sent.length, before);

  today.edit('a');
  assert.equal(today.getState().editing?.text, 'entry a', 'reopened on the saved words');
});

test('cancelling while an edit is being saved changes nothing', async () => {
  const { api, today } = await openToday(['a']);
  const patch = held();
  api.answer('PATCH /entries/a', () => patch.reply);

  today.edit('a');
  today.typeEdit('changed');
  const saving = today.saveEdit();
  today.cancelEdit();

  assert.deepEqual(today.getState().editing?.save, { status: 'saving' });

  patch.release({ kind: 'ok', data: { ...entry('a', 1), content: 'changed' } });
  await saving;
  assert.equal(contentOf(today, 'a'), 'changed');
});

test('one entry is edited at a time: opening another puts back the first`s words', async () => {
  const { today } = await openToday(['a', 'b']);

  today.edit('a');
  today.typeEdit('half done');
  today.edit('b');

  assert.equal(today.getState().editing?.id, 'b');
  assert.equal(contentOf(today, 'a'), 'entry a');
});

test('no other editor opens while an edit is being saved', async () => {
  const { api, today } = await openToday(['a', 'b']);
  const patch = held();
  api.answer('PATCH /entries/a', () => patch.reply);

  today.edit('a');
  today.typeEdit('changed');
  const saving = today.saveEdit();
  today.edit('b');

  assert.equal(today.getState().editing?.id, 'a');

  patch.release({ kind: 'ok', data: { ...entry('a', 1), content: 'changed' } });
  await saving;
});

test('an answer about the day that left the API before the edit was saved does not bring the old words back', async () => {
  const { api, today } = await openToday(['a']);
  const page = held();
  api.answer('GET /entries', () => page.reply);

  const looking = today.look();
  await settle();

  today.edit('a');
  today.typeEdit('new words');
  await today.saveEdit();

  page.release({ kind: 'ok', data: [entry('a', 1)] });
  await looking;

  assert.equal(contentOf(today, 'a'), 'new words');
});

test('an answer about the day asked for after the edit was saved is believed', async () => {
  const { api, today } = await openToday(['a']);

  today.edit('a');
  today.typeEdit('new words');
  await today.saveEdit();

  api.answer('GET /entries', () => ({
    kind: 'ok',
    data: [{ ...entry('a', 1), content: 'changed in another tab' }],
  }));
  await today.look();

  assert.equal(contentOf(today, 'a'), 'changed in another tab');
});

test('an entry of a past date is edited as on Today', async () => {
  const { api, page } = await openPast(['a', 'b']);

  page.edit('a');
  page.typeEdit('a past day, changed');
  await page.saveEdit();

  assert.deepEqual(
    api.sent.filter((s) => s.method === 'PATCH').map((s) => [s.path, s.body]),
    [['/entries/a', { content: 'a past day, changed' }]],
  );
  assert.equal(contentOf(page, 'a'), 'a past day, changed');
  assert.deepEqual(shown(page), ['a', 'b']);
});

test('an edit on a past date that fails keeps the changed words', async () => {
  const { api, page } = await openPast(['a']);
  api.answer('PATCH /entries/a', () => NO_ANSWER);

  page.edit('a');
  page.typeEdit('kept');
  await page.saveEdit();

  assert.deepEqual(page.getState().editing, {
    id: 'a',
    text: 'kept',
    save: { status: 'notSaved', why: 'unreachable' },
  });
});

/* ---- Where Today is scrolled to ---------------------------------------- */

test('Today is scrolled to the bottom when its day is first shown, and when it comes back after a failure', async () => {
  const api = fakeApi(['a']);
  const today = createToday({ request: api.request, pageSize: 200 });
  const opening = today.getState();

  await today.open();

  assert.equal(scrollsToBottom(undefined, today.getState()), true);
  assert.equal(scrollsToBottom(opening, today.getState()), true);

  const failed: TodayState = {
    ...today.getState(),
    day: { status: 'unreachable', asked: 1 },
  };
  assert.equal(scrollsToBottom(today.getState(), failed), false);
  assert.equal(scrollsToBottom(failed, today.getState()), true);
});

test('Today is scrolled to the bottom once a saved entry has arrived, and not before', async () => {
  const { today } = await openToday(['a']);
  const states: TodayState[] = [today.getState()];
  today.subscribe(() => states.push(today.getState()));

  today.type('a new entry');
  await today.save();

  const scrolls = states
    .slice(1)
    .map((state, index) => scrollsToBottom(states[index], state));

  assert.equal(scrolls.filter(Boolean).length, 1);
  assert.equal(scrolls.at(-1), true, 'the last change is the entry arriving');
});

test('opening, saving or cancelling an edit, a delete, a mood, or looking again never moves Today', async () => {
  const { today } = await openToday(['a', 'b']);
  const states: TodayState[] = [today.getState()];
  today.subscribe(() => states.push(today.getState()));

  today.edit('a');
  today.typeEdit('changed');
  await today.saveEdit();
  today.edit('b');
  today.cancelEdit();
  today.askToDelete('b');
  await today.goAhead();
  await today.pressMood(Mood.Good);
  await today.look();

  for (let at = 1; at < states.length; at += 1) {
    assert.equal(scrollsToBottom(states[at - 1], states[at]), false, `change ${at}`);
  }
});

/* ---- The mood body ------------------------------------------------------ */

test('the mood body on Today is the contract`s shape too: one field, a word or null', async () => {
  const { api, today } = await openToday(['a']);

  await today.pressMood(Mood.Even);
  await today.pressMood(Mood.Even);

  assert.deepEqual(
    api.sent.filter((s) => s.method === 'PUT').map((s) => s.body),
    [{ mood: 'Even' }, { mood: null }],
  );
});

/* ---- Keep out of memory: the composer's tick ---------------------------- */

const posted = (api: ReturnType<typeof fakeApi>) =>
  api.sent.filter((s) => s.method === 'POST').map((s) => s.body);

test('the tick starts off, and a press turns it on and off again', async () => {
  const { today } = await openToday();

  assert.equal(today.getState().keepOut, false);
  today.toggleKeepOut();
  assert.equal(today.getState().keepOut, true);
  today.toggleKeepOut();
  assert.equal(today.getState().keepOut, false);
});

test('the tick is sent with the entry, and turns off once the save succeeds', async () => {
  const { api, today } = await openToday();
  const post = held();
  api.answer('POST /entries', () => post.reply);

  today.toggleKeepOut();
  today.type('only for me');
  const saving = today.save();

  assert.deepEqual(posted(api), [
    { content: 'only for me', keptOutOfMemory: true },
  ]);
  assert.equal(today.getState().keepOut, true, 'still on while it saves');

  post.release({
    kind: 'ok',
    data: { ...entry('n', 30), content: 'only for me', keptOutOfMemory: true },
  });
  await saving;

  assert.equal(today.getState().keepOut, false);
});

for (const [name, reply] of [
  ['gets no answer', NO_ANSWER],
  ['is refused', SERVER_ERROR],
] as const) {
  test(`a save that ${name} keeps the tick as it was, with the words, and the next save sends it again`, async () => {
    const { api, today } = await openToday();
    api.answer('POST /entries', () => reply);

    today.toggleKeepOut();
    today.type('only for me');
    await today.save();

    assert.equal(today.getState().keepOut, true);
    assert.equal(today.getState().text, 'only for me');

    api.restore('POST /entries');
    await today.save();

    assert.deepEqual(posted(api), [
      { content: 'only for me', keptOutOfMemory: true },
      { content: 'only for me', keptOutOfMemory: true },
    ]);
    assert.equal(today.getState().keepOut, false);
  });
}

/* ---- Keep out of memory: "Use in memory" ------------------------------- */

const markOf = (page: { getState(): { day: unknown } }, id: string) =>
  (page.getState().day as { entries: Entry[] }).entries.find(
    (item) => item.id === id,
  )?.keptOutOfMemory;

const PUT_A_IN_MEMORY = 'PUT /entries/a/memory';

test('asking about an entry kept out sends nothing, and keeping it out leaves it as it was', async () => {
  const api = fakeApi(['a', 'b']);
  api.keepOut('a');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();
  const before = api.sent.length;

  today.askToUseInMemory('a');
  assert.equal(today.getState().memory.confirming, 'a');

  today.keepOutOfMemory();
  assert.equal(today.getState().memory.confirming, null);
  assert.equal(markOf(today, 'a'), true);
  assert.equal(api.sent.length, before);
});

test('an entry in memory cannot be asked about: it has no option, and nothing is sent', async () => {
  const { api, today } = await openToday(['a']);
  const before = api.sent.length;

  today.askToUseInMemory('a');
  await today.useInMemory();

  assert.equal(today.getState().memory.confirming, null);
  assert.equal(api.sent.length, before);
});

test('going ahead without having been asked sends nothing', async () => {
  const api = fakeApi(['a']);
  api.keepOut('a');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();
  const before = api.sent.length;

  await today.useInMemory();

  assert.equal(api.sent.length, before);
});

test('yes waits for the API: the row stays kept out while it saves, then is in memory, and a screen reader is told', async () => {
  const api = fakeApi(['a', 'b']);
  api.keepOut('a', 'b');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();
  const put = held();
  api.answer(PUT_A_IN_MEMORY, () => put.reply);

  today.askToUseInMemory('a');
  const going = today.useInMemory();

  assert.equal(markOf(today, 'a'), true, 'before any answer');
  assert.deepEqual(today.getState().memory.saving, ['a']);
  assert.equal(today.getState().memory.confirming, null);

  put.release({
    kind: 'ok',
    data: { ...entry('a', 1), keptOutOfMemory: false },
  });
  await going;

  assert.equal(markOf(today, 'a'), false);
  assert.equal(markOf(today, 'b'), true, 'and no other');
  assert.deepEqual(today.getState().memory.saving, []);
  assert.deepEqual(today.getState().memory.heard, ['a']);
  assert.deepEqual(
    api.sent.filter((s) => s.method === 'PUT').map((s) => [s.path, s.body]),
    [['/entries/a/memory', undefined]],
  );
});

test('while it saves, asking again about the same entry does nothing, and a second yes sends nothing', async () => {
  const api = fakeApi(['a']);
  api.keepOut('a');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();
  const put = held();
  api.answer(PUT_A_IN_MEMORY, () => put.reply);

  today.askToUseInMemory('a');
  const going = today.useInMemory();

  today.askToUseInMemory('a');
  assert.equal(today.getState().memory.confirming, null);
  await today.useInMemory();

  put.release({ kind: 'ok', data: { ...entry('a', 1) } });
  await going;

  assert.equal(api.count('PUT', '/entries/a/memory'), 1);
});

for (const [name, reply, why] of [
  ['gets no answer', NO_ANSWER, 'unreachable'],
  ['is refused', SERVER_ERROR, 'refused'],
] as const) {
  test(`a yes that ${name} leaves the entry kept out, with its reason, until it is asked about again`, async () => {
    const api = fakeApi(['a']);
    api.keepOut('a');
    const today = createToday({ request: api.request, pageSize: 200 });
    await today.open();
    api.answer(PUT_A_IN_MEMORY, () => reply);

    today.askToUseInMemory('a');
    await today.useInMemory();

    assert.equal(markOf(today, 'a'), true);
    assert.deepEqual(today.getState().memory.notSaved, { a: why });
    assert.deepEqual(today.getState().memory.heard, []);

    today.askToUseInMemory('a');
    assert.deepEqual(today.getState().memory.notSaved, {});
  });
}

test('a yes whose session has ended says nothing, and the entry stays kept out', async () => {
  const api = fakeApi(['a']);
  api.keepOut('a');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();
  api.answer(PUT_A_IN_MEMORY, () => ENDED);

  today.askToUseInMemory('a');
  await today.useInMemory();

  assert.equal(markOf(today, 'a'), true);
  assert.deepEqual(today.getState().memory.notSaved, {});
});

test('a yes answered 404 takes the entry off the page, and says it had been deleted', async () => {
  const api = fakeApi(['a', 'b']);
  api.keepOut('a');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();
  api.answer(PUT_A_IN_MEMORY, () => NOT_FOUND);

  today.askToUseInMemory('a');
  await today.useInMemory();

  assert.deepEqual(shown(today), ['b']);
  assert.equal(today.getState().editedGone, true);
});

test('an answer about the day that left the API before the entry was put in memory does not show it kept out again', async () => {
  const api = fakeApi(['a']);
  api.keepOut('a');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();

  const stale = held();
  api.answer('GET /entries', () => stale.reply);
  const looking = today.look();

  today.askToUseInMemory('a');
  await today.useInMemory();

  stale.release({
    kind: 'ok',
    data: [{ ...entry('a', 1), keptOutOfMemory: true }],
  });
  await looking;

  assert.equal(markOf(today, 'a'), false);
});

test('asking about a delete closes the question about memory, and the other way round', async () => {
  const api = fakeApi(['a', 'b']);
  api.keepOut('a');
  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();

  today.askToUseInMemory('a');
  today.askToDelete('b');
  assert.equal(today.getState().memory.confirming, null);
  assert.equal(today.getState().confirming, 'b');

  today.askToUseInMemory('a');
  assert.equal(today.getState().confirming, null);
  assert.equal(today.getState().memory.confirming, 'a');
});

test('a past date puts an entry in memory as Today does', async () => {
  const api = fakeApi(['today1']);
  api.file(PAST, ['a', 'b']);
  api.keepOut('a');
  const page = createPastDay({ request: api.request, pageSize: 200, date: PAST });
  await page.open();

  page.askToUseInMemory('a');
  await page.useInMemory();

  assert.equal(markOf(page, 'a'), false);
  assert.equal(api.count('PUT', '/entries/a/memory'), 1);
});
