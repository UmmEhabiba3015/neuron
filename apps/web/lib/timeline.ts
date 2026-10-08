/*
 * The Timeline: every day that has an entry, newest first, a month at a time.
 *
 * Like today.ts, this file is tested with Node alone, and the component
 * draws what `getState()` says.
 *
 * Two rules decide everything here.
 *
 *   An entry is on the day its `date` says. Nothing is worked out from
 *   `createdAt`, which is used only to order the entries inside one day.
 *
 *   The list from the API is ordered by `createdAt` and not by `date`. The
 *   two orders agree today and may not after Day 34, so entries of one date
 *   are not assumed to sit next to each other, and the days are ordered by
 *   their own date.
 *
 * The whole journal is loaded in order to list it. That is known to be the
 * wrong long-term shape, and is Day 29's problem.
 */

import type { WireDay, WireEntry } from '@neuron/contracts';
import { monthOf } from './format.ts';
import { MAX_PAGES, type Request } from './today.ts';

export interface TimelineDay {
  date: string;
  /*
   * Newest first, as the rest of the Timeline runs. The day's own page reads
   * the other way, oldest first, on purpose: there a day is read from
   * morning to night.
   */
  entries: readonly WireEntry[];
}

export interface TimelineMonth {
  /* As "2026-08". */
  month: string;
  days: readonly TimelineDay[];
}

/*
 * `today` is the API's date for today. The screen shows it in the date box,
 * and uses it to send today's row to Today's own address.
 *
 * `complete` is false when the page cap was reached. The list then holds the
 * newest entries only, and says so.
 */
export type TimelineView =
  | { status: 'opening' }
  | {
      status: 'open';
      today: string;
      months: readonly TimelineMonth[];
      complete: boolean;
    }
  | { status: 'empty'; today: string }
  | { status: 'unreachable'; asked: number }
  | { status: 'failed'; asked: number };

export interface TimelineState {
  view: TimelineView;
  /* The question is in flight. */
  asking: boolean;
}

export interface Timeline {
  getState(): TimelineState;
  subscribe(listener: () => void): () => void;
  /* Asks the API. A press while it is asking sends nothing. */
  open(): Promise<void>;
}

/* Months, days and the entries of each day: all newest first. */
export function groupByDay(entries: readonly WireEntry[]): TimelineMonth[] {
  const byDate = new Map<string, WireEntry[]>();

  for (const entry of entries) {
    const day = byDate.get(entry.date);

    if (day) {
      day.push(entry);
    } else {
      byDate.set(entry.date, [entry]);
    }
  }

  /* Two dates written as YYYY-MM-DD compare correctly as text. */
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
  const months: { month: string; days: TimelineDay[] }[] = [];

  for (const date of dates) {
    const day: TimelineDay = {
      date,
      entries: byDate
        .get(date)!
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
    const last = months[months.length - 1];

    if (last && last.month === monthOf(date)) {
      last.days.push(day);
    } else {
      months.push({ month: monthOf(date), days: [day] });
    }
  }

  return months;
}

type Fetched =
  | { status: 'loaded'; today: string; entries: WireEntry[]; complete: boolean }
  | { status: 'unreachable' }
  | { status: 'failed' }
  | { status: 'ended' };

function statusOf(
  kind: 'rejected' | 'ended' | 'unreachable',
): 'failed' | 'ended' | 'unreachable' {
  return kind === 'rejected' ? 'failed' : kind;
}

export function createTimeline(config: {
  request: Request;
  pageSize: number;
  maxPages?: number;
}): Timeline {
  const { request, pageSize, maxPages = MAX_PAGES } = config;

  let view: TimelineView = { status: 'opening' };
  let asking = false;
  let asked = 0;

  /* Numbers each question, so that only the latest one's answer is used. */
  let question = 0;

  const listeners = new Set<() => void>();
  let state: TimelineState = { view, asking };

  function publish(): void {
    state = { view, asking };
    listeners.forEach((listener) => listener());
  }

  async function fetchAll(): Promise<Fetched> {
    const today = await request<WireDay>('/days/today');

    if (today.kind !== 'ok') {
      return { status: statusOf(today.kind) };
    }

    const entries: WireEntry[] = [];
    let complete = true;

    /* A short page is the last one. */
    for (let pages = 0; ; pages += 1) {
      if (pages === maxPages) {
        complete = false;
        break;
      }

      const page = await request<WireEntry[]>(
        `/entries?limit=${pageSize}&offset=${entries.length}`,
      );

      if (page.kind !== 'ok') {
        return { status: statusOf(page.kind) };
      }

      entries.push(...page.data);

      if (page.data.length < pageSize) {
        break;
      }
    }

    return { status: 'loaded', today: today.data.date, entries, complete };
  }

  /*
   * When the cap stops the loading, the oldest entry that arrived may have
   * neighbours on its day that did not arrive. A day shown with some of its
   * entries missing would be a false statement about that day, so that one
   * day is left out, unless it is the only day there is.
   */
  function shownWhenCut(entries: WireEntry[]): WireEntry[] {
    const cut = entries[entries.length - 1]?.date;
    const rest = entries.filter((entry) => entry.date !== cut);

    return rest.length > 0 ? rest : entries;
  }

  async function open(): Promise<void> {
    if (asking) {
      return;
    }

    question += 1;
    const mine = question;

    asking = true;
    publish();

    const answer = await fetchAll();

    if (mine !== question) {
      return;
    }

    asking = false;

    if (answer.status === 'loaded') {
      asked = 0;

      const shown = answer.complete
        ? answer.entries
        : shownWhenCut(answer.entries);

      view =
        shown.length === 0
          ? { status: 'empty', today: answer.today }
          : {
              status: 'open',
              today: answer.today,
              months: groupByDay(shown),
              complete: answer.complete,
            };
    } else if (answer.status !== 'ended') {
      /*
       * `ended` changes nothing here: the session module has recorded that
       * the person is signed out, and the screen leaves for /in.
       */
      asked += 1;
      view = { status: answer.status, asked };
    }

    publish();
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open,
  };
}
