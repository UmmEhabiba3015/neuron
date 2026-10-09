import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { WireEntry } from '@neuron/contracts';
import type { ApiResult } from './session.ts';
import { createTimeline, groupByDay, type TimelineView } from './timeline.ts';
import { createToday, MAX_PAGES, type Request } from './today.ts';

/*
 * A stand-in for the API. It holds a list of entries in the order the API
 * would send them, newest `createdAt` first, and serves it a page at a time.
 */
type Reply = ApiResult<unknown>;

const NO_ANSWER: Reply = { kind: 'unreachable' };
const SERVER_ERROR: Reply = { kind: 'rejected', status: 500, messages: [] };
const ENDED: Reply = { kind: 'ended' };

const TODAY = '2026-09-02';

const entry = (id: string, date: string, createdAt: string): WireEntry => ({
  id,
  content: `entry ${id}`,
  createdAt,
  date,
});

function held() {
  let release!: (reply: Reply) => void;
  const reply = new Promise<Reply>((resolve) => {
    release = resolve;
  });

  return { reply, release };
}

function fakeApi(entries: WireEntry[]) {
  const sent: string[] = [];
  const overrides: Record<string, () => Reply | Promise<Reply>> = {};

  const request = (async (path: string) => {
    const route = path.split('?')[0];

    sent.push(path);

    if (overrides[route]) {
      return overrides[route]();
    }

    if (route === '/days/today') {
      return { kind: 'ok', data: { date: TODAY, mood: null } };
    }

    if (route === '/entries') {
      const query = new URLSearchParams(path.split('?')[1]);
      const offset = Number(query.get('offset'));
      const limit = Number(query.get('limit'));

      return { kind: 'ok', data: entries.slice(offset, offset + limit) };
    }

    /* The dates in the range that have an entry, newest first, as the API. */
    if (route === '/days') {
      const query = new URLSearchParams(path.split('?')[1]);
      const from = query.get('from')!;
      const to = query.get('to')!;
      const dates = [...new Set(entries.map((e) => e.date))]
        .filter((date) => date >= from && date <= to)
        .sort((a, b) => b.localeCompare(a));

      return {
        kind: 'ok',
        data: dates.map((date) => ({ date, mood: null })),
      };
    }

    throw new Error(`no answer written for ${path}`);
  }) as Request;

  return {
    request,
    sent,
    asked: (route: string) =>
      sent.filter((path) => path.split('?')[0] === route).length,
    answer(route: string, reply: () => Reply | Promise<Reply>) {
      overrides[route] = reply;
    },
    restore(route: string) {
      delete overrides[route];
    },
  };
}

/* What the Timeline shows, as plain text a test can compare. */
function drawn(view: TimelineView) {
  assert.equal(view.status, 'open');

  return (view as Extract<TimelineView, { status: 'open' }>).months.map(
    (month) => ({
      month: month.month,
      days: month.days.map(
        (day) => `${day.date}: ${day.entries.map((e) => e.id).join(' ')}`,
      ),
    }),
  );
}

/*
 * Five entries on three dates in two months, in the order the API sends
 * them: newest `createdAt` first. The two entries of 2 August do not sit
 * next to each other, which is what a list ordered by `createdAt` allows
 * once a person has changed timezone (Day 34).
 */
const FIVE = [
  entry('e', '2026-09-01', '2026-09-01T08:00:00.000Z'),
  entry('d', '2026-08-02', '2026-08-31T23:30:00.000Z'),
  entry('c', '2026-08-31', '2026-08-31T10:00:00.000Z'),
  entry('b', '2026-08-31', '2026-08-31T07:00:00.000Z'),
  entry('a', '2026-08-02', '2026-08-02T09:00:00.000Z'),
];

test('entries from two pages, on three dates in two months, are grouped by day and ordered as the Timeline shows them', async () => {
  const api = fakeApi(FIVE);
  const timeline = createTimeline({ request: api.request, pageSize: 3 });

  await timeline.open();

  assert.deepEqual(drawn(timeline.getState().view), [
    { month: '2026-09', days: ['2026-09-01: e'] },
    { month: '2026-08', days: ['2026-08-31: c b', '2026-08-02: d a'] },
  ]);

  /*
   * Two pages, one question about today, and one about the dates of
   * today's month. Nothing is asked per day.
   */
  assert.deepEqual(api.sent, [
    '/days/today',
    '/days?from=2026-09-01&to=2026-09-30',
    '/entries?limit=3&offset=0',
    '/entries?limit=3&offset=3',
  ]);
});

test('the same three entries of one day: newest first on the Timeline, oldest first on the day`s own page', async () => {
  const three = [
    entry('night', TODAY, `${TODAY}T21:00:00.000Z`),
    entry('noon', TODAY, `${TODAY}T12:00:00.000Z`),
    entry('morning', TODAY, `${TODAY}T07:00:00.000Z`),
  ];
  const api = fakeApi(three);

  const timeline = createTimeline({ request: api.request, pageSize: 200 });
  await timeline.open();

  assert.deepEqual(drawn(timeline.getState().view), [
    { month: '2026-09', days: [`${TODAY}: night noon morning`] },
  ]);

  const today = createToday({ request: api.request, pageSize: 200 });
  await today.open();

  const day = today.getState().day;
  assert.equal(day.status, 'open');
  assert.deepEqual(
    (day as Extract<typeof day, { status: 'open' }>).entries.map((e) => e.id),
    ['morning', 'noon', 'night'],
  );
});

test('the Timeline carries the API`s date for today, and never one of its own', async () => {
  const api = fakeApi(FIVE);
  const timeline = createTimeline({ request: api.request, pageSize: 200 });

  await timeline.open();

  assert.equal(
    (timeline.getState().view as { today: string }).today,
    TODAY,
  );
});

test('the calendar shows the month of the API`s today, and marks the dates the API says have an entry', async () => {
  /* Today is 2 September. The list holds August too; the calendar does not. */
  const api = fakeApi(FIVE);
  const timeline = createTimeline({ request: api.request, pageSize: 200 });

  await timeline.open();

  const view = timeline.getState().view;
  assert.equal(view.status, 'open');
  assert.deepEqual((view as { calendar: unknown }).calendar, {
    month: '2026-09',
    written: ['2026-09-01'],
  });
  assert.equal(api.asked('/days'), 1);
});

test('an entry is placed by its date, even when its createdAt read on this machine falls on another date', () => {
  /*
   * Noon UTC on the 10th is the 10th or the 11th on every clock in the
   * world, and never the 9th. So whatever timezone this test runs in, a
   * date worked out from createdAt would not be the 9th.
   */
  const createdAt = '2026-08-10T12:00:00.000Z';
  assert.notEqual(new Date(createdAt).getDate(), 9);

  const months = groupByDay([
    entry('filed-on-the-9th', '2026-08-09', createdAt),
    entry('filed-on-the-12th', '2026-08-12', '2026-08-10T12:05:00.000Z'),
  ]);

  assert.deepEqual(
    months.flatMap((month) => month.days.map((day) => day.date)),
    ['2026-08-12', '2026-08-09'],
  );
  assert.equal(months[0].days[1].entries[0].id, 'filed-on-the-9th');
});

test('the days are ordered by their date, and not by the order their entries arrived in', () => {
  const months = groupByDay([
    entry('x', '2026-01-05', '2026-03-01T00:00:00.000Z'),
    entry('y', '2026-02-01', '2026-02-01T00:00:00.000Z'),
    entry('z', '2025-12-31', '2026-01-09T00:00:00.000Z'),
  ]);

  assert.deepEqual(
    months.map((month) => month.month),
    ['2026-02', '2026-01', '2025-12'],
  );
});

test('when the page cap is reached the Timeline says the list is not complete, asks no more, and leaves out the day that may be cut', async () => {
  /* The API always has another full page: twelve entries, two a day. */
  const twelve = Array.from({ length: 12 }, (_, index) => {
    const day = String(28 - Math.floor(index / 2)).padStart(2, '0');

    return entry(`n${index}`, `2026-08-${day}`, `2026-08-${day}T0${index % 2}:00:00.000Z`);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const api = fakeApi(twelve);
  const timeline = createTimeline({
    request: api.request,
    pageSize: 3,
    maxPages: 2,
  });

  await timeline.open();

  const view = timeline.getState().view;

  assert.equal(api.asked('/entries'), 2);
  assert.equal(view.status, 'open');
  assert.equal((view as { complete: boolean }).complete, false);

  /*
   * Six entries arrived: both of the 28th, both of the 27th, both of the
   * 26th. The 26th is where the list was cut, so it is not shown: the cap
   * cannot know that it arrived whole.
   */
  assert.deepEqual(drawn(view), [
    { month: '2026-08', days: ['2026-08-28: n1 n0', '2026-08-27: n3 n2'] },
  ]);
});

test('a journal that ends before the cap is complete', async () => {
  const api = fakeApi(FIVE);
  const timeline = createTimeline({
    request: api.request,
    pageSize: 3,
    maxPages: 2,
  });

  await timeline.open();

  assert.equal(
    (timeline.getState().view as { complete: boolean }).complete,
    true,
  );
});

test('the default cap is the one a day`s page uses', async () => {
  const api = fakeApi([]);
  api.answer('/entries', () => ({
    kind: 'ok',
    data: [
      entry(`p${api.sent.length}a`, '2026-08-01', '2026-08-01T01:00:00.000Z'),
      entry(`p${api.sent.length}b`, '2026-08-01', '2026-08-01T02:00:00.000Z'),
    ],
  }));

  const timeline = createTimeline({ request: api.request, pageSize: 2 });
  await timeline.open();

  assert.equal(api.asked('/entries'), MAX_PAGES);

  /* One day is all there is, so it is shown although it may be cut. */
  const view = timeline.getState().view;
  assert.equal(view.status, 'open');
  assert.equal((view as { complete: boolean }).complete, false);
});

/* ---- States ------------------------------------------------------------ */

test('opening: the Timeline says it is opening until the API has answered', async () => {
  const api = fakeApi(FIVE);
  const list = held();
  api.answer('/entries', () => list.reply);

  const timeline = createTimeline({ request: api.request, pageSize: 200 });
  assert.deepEqual(timeline.getState(), {
    view: { status: 'opening' },
    asking: false,
  });

  const opening = timeline.open();
  assert.deepEqual(timeline.getState(), {
    view: { status: 'opening' },
    asking: true,
  });

  list.release({ kind: 'ok', data: FIVE });
  await opening;

  assert.equal(timeline.getState().view.status, 'open');
  assert.equal(timeline.getState().asking, false);
});

for (const [name, reply, status] of [
  ['unreachable: no answer from the server', NO_ANSWER, 'unreachable'],
  ['failed: the server answered with an error', SERVER_ERROR, 'failed'],
] as const) {
  for (const route of ['/days/today', '/days', '/entries']) {
    test(`${name}, on ${route}, is its own state, counts each question, and can be asked again`, async () => {
      const api = fakeApi(FIVE);
      api.answer(route, () => reply);

      const timeline = createTimeline({ request: api.request, pageSize: 200 });

      await timeline.open();
      assert.deepEqual(timeline.getState().view, { status, asked: 1 });

      await timeline.open();
      assert.deepEqual(timeline.getState().view, { status, asked: 2 });

      api.restore(route);
      await timeline.open();
      assert.equal(timeline.getState().view.status, 'open');
    });
  }
}

test('asking again says so while it asks, and a second press sends nothing', async () => {
  const api = fakeApi(FIVE);
  api.answer('/days/today', () => NO_ANSWER);

  const timeline = createTimeline({ request: api.request, pageSize: 200 });
  await timeline.open();

  const again = held();
  api.answer('/days/today', () => again.reply);

  const first = timeline.open();
  const second = timeline.open();

  assert.deepEqual(timeline.getState(), {
    view: { status: 'unreachable', asked: 1 },
    asking: true,
  });

  again.release(NO_ANSWER);
  await Promise.all([first, second]);

  assert.equal(api.asked('/days/today'), 2);
  assert.deepEqual(timeline.getState(), {
    view: { status: 'unreachable', asked: 2 },
    asking: false,
  });
});

test('empty: a journal with no entries at all is its own state, and not a failure', async () => {
  const api = fakeApi([]);
  const timeline = createTimeline({ request: api.request, pageSize: 200 });

  await timeline.open();

  assert.deepEqual(timeline.getState().view, { status: 'empty', today: TODAY });
});

test('a session that ends while the Timeline is opening is not shown as a failure', async () => {
  const api = fakeApi(FIVE);
  api.answer('/entries', () => ENDED);

  const timeline = createTimeline({ request: api.request, pageSize: 200 });
  await timeline.open();

  assert.deepEqual(timeline.getState().view, { status: 'opening' });
});

test('subscribers are told when the Timeline changes, and not after they leave', async () => {
  const api = fakeApi(FIVE);
  const timeline = createTimeline({ request: api.request, pageSize: 200 });

  let told = 0;
  const leave = timeline.subscribe(() => {
    told += 1;
  });

  await timeline.open();
  assert.equal(told, 2);

  leave();
  await timeline.open();
  assert.equal(told, 2);
});
