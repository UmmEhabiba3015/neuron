/*
 * Keep out of memory (docs/features.md, Ref 25): the words a screen shows
 * for it, and the small decisions behind them. Tested with Node alone.
 *
 * The mark goes one way (her ruling, 2026-10-28). It is chosen when an
 * entry is saved, by the tick under the composer or on Talk. An entry kept
 * out can be put in memory, after a question; an entry in memory can never
 * be kept out, because a model may already have read it. So an entry in
 * memory has no option at all, and its menu only says so.
 *
 * Where the request is sent and what its answer does is lib/today.ts's.
 */
import type { Entry } from '@neuron/contracts';
import { EntryKind } from '@neuron/contracts';

/* The tick under the composer, and the same tick on Talk. */
export const KEEP_OUT_LABEL = 'Keep this out of memory';

/* The one option of an entry kept out, and the button that confirms it. */
export const USE_IN_MEMORY = 'Use in memory';

/* The safe answer to the question, which leaves the entry as it is. */
export const KEEP_IT_OUT = 'Keep it out';

export const PUTTING_IN_MEMORY = 'Putting it in memory.';

export type MemoryNotSaved = 'unreachable' | 'refused';

/* What the tick draws: pressed when on, with its one label. */
export interface Tick {
  pressed: boolean;
  label: string;
}

export function tickOf(on: boolean): Tick {
  return { pressed: on, label: KEEP_OUT_LABEL };
}

/*
 * What the day's store knows about one row's mark, besides the entry:
 *
 *   saving    "Use in memory" was confirmed, and the API has not answered
 *   notSaved  it answered with a failure, and the entry is still kept out
 *   heard     it answered yes on this page, and a screen reader is told
 */
export interface RowMemory {
  saving: boolean;
  notSaved?: MemoryNotSaved;
  heard: boolean;
}

/*
 * What a row's memory menu draws.
 *
 * `excluded` is the designer's data-excluded. `note` is the menu of an
 * entry in memory, which has no option. `option` is the menu of an entry
 * kept out. `line` is the sentence in the row: `hidden` is for one only a
 * screen reader needs, because the trigger already shows it.
 */
export interface MemoryMenu {
  excluded: boolean;
  trigger: string;
  ariaLabel: string;
  note?: string;
  option?: { label: string; disabled: boolean };
  line?: { text: string; hidden: boolean };
  problem?: string;
}

type Marked = Pick<Entry, 'kind' | 'keptOutOfMemory'>;

function nameOf(entry: Marked): { title: string; plain: string } {
  return entry.kind === EntryKind.Voice
    ? { title: 'Voice memo', plain: 'voice memo' }
    : { title: 'Entry', plain: 'entry' };
}

const NOT_SAVED_START: Record<MemoryNotSaved, string> = {
  unreachable: 'We could not reach the server.',
  refused: 'Something went wrong on our side.',
};

export function memoryMenuOf(entry: Marked, row: RowMemory): MemoryMenu {
  const { title, plain } = nameOf(entry);

  if (!entry.keptOutOfMemory) {
    return {
      excluded: false,
      trigger: 'In memory',
      ariaLabel: `${title} memory settings: in memory`,
      note: `This ${plain} is in memory.`,
      line: row.heard
        ? { text: `This ${plain} is in memory now.`, hidden: true }
        : undefined,
    };
  }

  return {
    excluded: true,
    trigger: 'Kept out of memory',
    ariaLabel: `${title} memory settings: kept out of memory`,
    option: { label: USE_IN_MEMORY, disabled: row.saving },
    line: row.saving ? { text: PUTTING_IN_MEMORY, hidden: false } : undefined,
    problem: row.notSaved
      ? `${NOT_SAVED_START[row.notSaved]} The change was not saved. This ${plain} is still kept out of memory.`
      : undefined,
  };
}

/* The question asked, in the row, before an entry is put in memory. */
export function inMemoryQuestion(entry: Pick<Entry, 'kind'>): string {
  return `Use this ${nameOf({ ...entry, keptOutOfMemory: true }).plain} in memory? This cannot be undone.`;
}

/*
 * The tick on Talk. It is its own small store, because the recorder's
 * state is about the recording. `take` is what a kept memo is sent with:
 * the tick as it is, which then turns off, so the next memo starts in
 * memory.
 */
export interface MemoryTick {
  getState(): boolean;
  subscribe(listener: () => void): () => void;
  toggle(): void;
  take(): boolean;
}

export function createMemoryTick(): MemoryTick {
  let on = false;
  const listeners = new Set<() => void>();

  function set(next: boolean): void {
    on = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getState: () => on,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toggle: () => set(!on),
    take() {
      const taken = on;

      if (on) {
        set(false);
      }

      return taken;
    },
  };
}
