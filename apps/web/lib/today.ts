/*
 * Today: what the screen holds, and what each press does to it.
 *
 * Like session.ts, this file imports nothing that exists when it runs, so it
 * is tested with Node alone. The function that sends a request and the size
 * of a page are handed in. The components draw what `getState()` says and
 * decide nothing.
 *
 * The three choices are ADR-021's:
 *
 *   Writing   wait, then show. The text stays until the API has confirmed
 *             the entry, and the API is then asked for today again.
 *   Deleting  show at once. The entry leaves the screen before any answer,
 *             and returns to its place if the delete fails.
 *   Asking    wait, and say that the question is being asked.
 *   Mood      show at once. The word is marked before any answer, and goes
 *             back to what the API last confirmed if the request fails.
 */

import type { Mood, WireDay, WireEntry, WireNewEntry } from '@neuron/contracts';
import type { ApiResult, RequestOptions } from './session.ts';

export type Request = <T>(
  path: string,
  options?: RequestOptions,
) => Promise<ApiResult<T>>;

/*
 * `asked` is how many times in a row the question has failed. It is what
 * lets the screen change when "Try again" gets the same failure again.
 */
export type Day =
  | { status: 'opening' }
  | {
      status: 'open';
      date: string;
      mood: Mood | null;
      entries: readonly WireEntry[];
    }
  | { status: 'unreachable'; asked: number }
  | { status: 'failed'; asked: number };

/*
 * `unreachable`, `refused` and `ended` are never merged: no answer from the
 * server, a refusal by it, and an ended session are three different facts.
 * `blank` is the API's 400 for a body with no words in it.
 */
export type NotSaved = 'unreachable' | 'refused' | 'blank' | 'ended';

/* `saved` lasts from the API's confirmation until today has been shown again. */
export type Save =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved' }
  | { status: 'notSaved'; why: NotSaved };

export type NotDeleted = 'unreachable' | 'refused';

export type MoodNotSaved = 'unreachable' | 'refused';

/* A press on a mood word: the day it was pressed on, and what it asks for. */
type MoodPress = { date: string; mood: Mood | null };

export interface TodayState {
  day: Day;
  /* A question about today is in flight. */
  asking: boolean;
  text: string;
  save: Save;
  /* The entry the person is being asked about, before it is deleted. */
  confirming: string | null;
  /* Entries whose delete failed, and that are back on the screen. */
  notDeleted: Readonly<Record<string, NotDeleted>>;
  /* The last mood press failed, and the mood shown is the one before it. */
  moodNotSaved: MoodNotSaved | null;
}

export interface Today {
  getState(): TodayState;
  subscribe(listener: () => void): () => void;
  /* Asks the API for today. A press while it is asking sends nothing. */
  open(): Promise<void>;
  /* Asks again without disturbing what is on the screen. */
  look(): Promise<void>;
  type(text: string): void;
  save(): Promise<void>;
  /* Also takes away the sentence of a delete that failed. */
  askToDelete(id: string): void;
  keep(): void;
  /* Takes away the sentence of a delete that failed. The entry stays. */
  dismiss(id: string): void;
  /* Deletes the entry the person was asked about, and no other. */
  goAhead(): Promise<void>;
  /*
   * Marks the word at once and sends it. Pressing the word that is already
   * marked clears the mood.
   */
  pressMood(mood: Mood): Promise<void>;
}

/* Text that is only spaces or blank lines is not an entry. */
export function isBlank(text: string): boolean {
  return text.trim() === '';
}

type Fetched =
  | { status: 'loaded'; day: WireDay; entries: WireEntry[] }
  | { status: 'unreachable' }
  | { status: 'failed' }
  | { status: 'ended' };

function statusOf(
  kind: 'rejected' | 'ended' | 'unreachable',
): 'failed' | 'ended' | 'unreachable' {
  return kind === 'rejected' ? 'failed' : kind;
}

/*
 * The most pages of one day that are asked for. At the API's largest page
 * this is 4,000 entries, which is one every 22 seconds for a whole day, so
 * a day that needs more is an API that is not answering properly.
 */
export const MAX_PAGES = 20;

export function createToday(config: {
  request: Request;
  pageSize: number;
  maxPages?: number;
}): Today {
  const { request, pageSize, maxPages = MAX_PAGES } = config;

  let fetched: { day: WireDay; entries: WireEntry[] } | undefined;
  let trouble: 'unreachable' | 'failed' | undefined;
  let asked = 0;
  let asking = false;

  /* Numbers each question, so that only the latest one's answer is used. */
  let question = 0;

  /*
   * Entries that are not shown: a delete has been sent, or has succeeded.
   * A deleted entry is never taken out of `fetched`. It is hidden, so a
   * failed delete has nothing to put back and cannot put it in the wrong
   * place, and an answer that left the API before the delete cannot bring a
   * deleted entry back.
   */
  const hidden = new Set<string>();

  let text = '';
  let save: Save = { status: 'idle' };
  let confirming: string | null = null;
  let notDeleted: Record<string, NotDeleted> = {};

  /*
   * The mood the person last pressed, until the API has answered about it.
   * While it is here it is what the screen shows. The mood the API last
   * confirmed stays in `fetched`, which is what the screen goes back to.
   */
  let wanted: MoodPress | undefined;
  let sendingMood = false;
  let moodNotSaved: MoodNotSaved | null = null;

  /*
   * Counts the answers about a mood, so that an answer about today that was
   * asked for before one of them can be told apart.
   */
  let moodAnswers = 0;

  const listeners = new Set<() => void>();
  let state = snapshot();

  function moodShown(day: WireDay): Mood | null {
    return wanted && wanted.date === day.date ? wanted.mood : day.mood;
  }

  function snapshot(): TodayState {
    let day: Day = { status: 'opening' };

    if (trouble) {
      day = { status: trouble, asked };
    } else if (fetched) {
      day = {
        status: 'open',
        date: fetched.day.date,
        mood: moodShown(fetched.day),
        entries: fetched.entries.filter((entry) => !hidden.has(entry.id)),
      };
    }

    return { day, asking, text, save, confirming, notDeleted, moodNotSaved };
  }

  function publish(): void {
    state = snapshot();
    listeners.forEach((listener) => listener());
  }

  /*
   * The date is the API's: the browser never works out which day "today" is
   * (ADR-015).
   */
  async function fetchToday(): Promise<Fetched> {
    const day = await request<WireDay>('/days/today');

    if (day.kind !== 'ok') {
      return { status: statusOf(day.kind) };
    }

    const entries: WireEntry[] = [];

    /*
     * A short page is the last one. An API that never sent a short page
     * would be asked for ever, so the pages are counted.
     */
    for (let pages = 0; ; pages += 1) {
      if (pages === maxPages) {
        return { status: 'failed' };
      }

      const page = await request<WireEntry[]>(
        `/entries?date=${day.data.date}&limit=${pageSize}&offset=${entries.length}`,
      );

      if (page.kind !== 'ok') {
        return { status: statusOf(page.kind) };
      }

      entries.push(...page.data);

      if (page.data.length < pageSize) {
        break;
      }
    }

    /* The API lists newest first, and a day reads oldest first. */
    entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return { status: 'loaded', day: day.data, entries };
  }

  /*
   * `keep` is for asking while a day is already on the screen: it stays
   * unless the new answer is a good one.
   *
   * `ended` changes nothing here. The session module has already recorded
   * that the person is signed out, and the screen leaves for /in.
   */
  async function ask(keep: boolean): Promise<void> {
    question += 1;
    const mine = question;

    asking = true;
    publish();

    const moodAnswersBefore = moodAnswers;
    const answer = await fetchToday();

    if (mine !== question) {
      return;
    }

    asking = false;

    if (answer.status === 'loaded') {
      /*
       * If a mood was being sent, or was answered, while this question was
       * out, its answer may have left the API before the mood arrived there.
       * The mood already held is the newer one, and is kept.
       */
      const moodIsOlder =
        fetched?.day.date === answer.day.date &&
        (sendingMood || moodAnswers !== moodAnswersBefore);

      fetched = {
        day: moodIsOlder
          ? { ...answer.day, mood: fetched!.day.mood }
          : answer.day,
        entries: answer.entries,
      };
      trouble = undefined;
      asked = 0;

      if (save.status === 'saved') {
        save = { status: 'idle' };
      }
    } else if (answer.status !== 'ended' && (!keep || !fetched || trouble)) {
      trouble = answer.status;
      asked += 1;
    }

    publish();
  }

  async function open(): Promise<void> {
    if (asking) {
      return;
    }

    await ask(false);
  }

  async function look(): Promise<void> {
    if (asking) {
      return;
    }

    await ask(true);
  }

  async function saveEntry(): Promise<void> {
    /* No control is disabled, so this is what stops a second request. */
    if (save.status === 'saving') {
      return;
    }

    if (isBlank(text)) {
      return;
    }

    const typed = text;
    const body: WireNewEntry = { content: typed.trim() };

    save = { status: 'saving' };
    publish();

    const result = await request<WireEntry>('/entries', {
      method: 'POST',
      body,
    });

    if (result.kind !== 'ok') {
      save = { status: 'notSaved', why: whyNotSaved(result) };
      publish();
      return;
    }

    /*
     * Only what was sent is cleared. Anything typed after the press was not
     * part of the entry and stays in the composer.
     */
    text = text.startsWith(typed) ? text.slice(typed.length).trimStart() : text;
    save = { status: 'saved' };

    /*
     * The entry is not added to the page here. Its time and its day are the
     * API's to decide, and near midnight it may not belong to the day on
     * the screen. This question replaces any that is already in flight, because
     * that one may have been answered before the entry existed.
     */
    await ask(false);
  }

  function askToDelete(id: string): void {
    confirming = id;
    notDeleted = without(notDeleted, id);
    publish();
  }

  function dismiss(id: string): void {
    notDeleted = without(notDeleted, id);
    publish();
  }

  function keepEntry(): void {
    confirming = null;
    publish();
  }

  async function goAhead(): Promise<void> {
    const id = confirming;

    if (id === null || hidden.has(id)) {
      return;
    }

    confirming = null;
    hidden.add(id);
    notDeleted = without(notDeleted, id);
    publish();

    const result = await request<void>(`/entries/${id}`, { method: 'DELETE' });

    /* A 404 means the entry is already gone, perhaps from another tab. */
    const gone =
      result.kind === 'ok' ||
      (result.kind === 'rejected' && result.status === 404);

    if (gone) {
      return;
    }

    hidden.delete(id);

    if (result.kind !== 'ended') {
      notDeleted = {
        ...notDeleted,
        [id]: result.kind === 'unreachable' ? 'unreachable' : 'refused',
      };
    }

    publish();
  }

  /*
   * One request at a time, in the order of the presses. Two requests sent
   * together can reach the API in either order, and the API keeps whichever
   * arrives last, which need not be the one pressed last. So a press made
   * while a request is out is not sent until that request is answered. The
   * screen does not wait for any of this: the word is marked at once.
   */
  async function pressMood(mood: Mood): Promise<void> {
    if (!fetched || trouble) {
      return;
    }

    const { date } = fetched.day;

    wanted = { date, mood: moodShown(fetched.day) === mood ? null : mood };
    moodNotSaved = null;
    publish();

    if (sendingMood) {
      return;
    }

    sendingMood = true;

    while (wanted) {
      const sent: MoodPress = wanted;
      const body: { mood: Mood | null } = { mood: sent.mood };

      const result = await request<WireDay>(`/days/${sent.date}/mood`, {
        method: 'PUT',
        body,
      });

      moodAnswers += 1;

      if (result.kind === 'ok' && fetched?.day.date === sent.date) {
        fetched = { ...fetched, day: { ...fetched.day, mood: sent.mood } };
      }

      /*
       * The last press wins. If the person has pressed again since this
       * request left, this answer changes nothing they can see, whether it
       * is a good one or not, and the newer press is sent next.
       */
      if (wanted !== sent) {
        continue;
      }

      wanted = undefined;

      if (result.kind === 'unreachable') {
        moodNotSaved = 'unreachable';
      } else if (result.kind === 'rejected') {
        moodNotSaved = 'refused';
      }
    }

    sendingMood = false;
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
    look,
    type(next) {
      text = next;
      publish();
    },
    save: saveEntry,
    askToDelete,
    keep: keepEntry,
    dismiss,
    goAhead,
    pressMood,
  };
}

function whyNotSaved(
  result: Exclude<ApiResult<unknown>, { kind: 'ok' }>,
): NotSaved {
  if (result.kind === 'rejected') {
    return result.status === 400 ? 'blank' : 'refused';
  }

  return result.kind;
}

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const rest = { ...record };
  delete rest[key];
  return rest;
}
