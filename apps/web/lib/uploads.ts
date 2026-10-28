/*
 * The voice memos that have been kept and are being sent, or could not be.
 *
 * One list for the whole page, made in api/client.ts, because a memo is kept
 * on Talk and shown on Today: the screen changes while it is in flight. Its
 * audio is held in this page's memory and nowhere else (her decision,
 * 2026-10-16), so closing the page loses a memo that was not saved, and the
 * screen says so.
 *
 * Like today.ts, it is tested with Node alone: the function that sends a
 * request is handed in.
 *
 * Each memo is one of three:
 *
 *   saving    sent, and not answered yet. Today shows "Saving your
 *             recording." with no time, because the time is the API's.
 *   notSaved  the API did not take it. Today keeps the row, says so, and
 *             offers Try again, which sends the same audio again.
 *   saved     the API answered with the entry. Today shows its time, its
 *             length and its play button, and asks the API for the day again
 *             (ADR-021); once that answer holds the entry, the memo is
 *             forgotten here and the day shows it.
 */
import type { CreateVoiceMemo, Entry } from '@neuron/contracts';
import type { Request, TodayState } from './today.ts';
import type { Kept } from './recorder.ts';

export type Upload =
  | { id: string; durationMs: number; status: 'saving' }
  | { id: string; durationMs: number; status: 'notSaved' }
  | { id: string; durationMs: number; status: 'saved'; entry: Entry };

export interface UploadsState {
  uploads: readonly Upload[];
}

export interface Uploads {
  getState(): UploadsState;
  subscribe(listener: () => void): () => void;
  /*
   * Takes a kept memo and sends it, kept out of memory or not, as the tick
   * on Talk said when it was kept.
   */
  keep(memo: Kept, keptOutOfMemory: boolean): Promise<void>;
  /*
   * Sends a memo that was not saved again, with the same choice about
   * memory. Nothing for any other.
   */
  retry(id: string): Promise<void>;
  /* A saved memo that the day now shows. */
  forget(id: string): void;
  /* Signing out: what one person recorded is not left for the next. */
  clear(): void;
}

/* The name of the form's file field, as POST /entries/voice reads it. */
export const AUDIO_FIELD = 'audio';

export function createUploads(config: {
  request: Request;
  newId?: () => string;
}): Uploads {
  const { request } = config;
  const newId = config.newId ?? (() => crypto.randomUUID());

  let uploads: Upload[] = [];
  /*
   * The audio of each memo not yet saved, and whether it is kept out of
   * memory. Dropped once it is saved.
   */
  const audio = new Map<string, Kept & { keptOutOfMemory: boolean }>();

  const listeners = new Set<() => void>();
  let state: UploadsState = { uploads };

  function publish(): void {
    state = { uploads };
    listeners.forEach((listener) => listener());
  }

  function replace(next: Upload): void {
    uploads = uploads.map((upload) => (upload.id === next.id ? next : upload));
    publish();
  }

  async function send(id: string): Promise<void> {
    const memo = audio.get(id);

    if (!memo) {
      return;
    }

    replace({ id, durationMs: memo.durationMs, status: 'saving' });

    const fields: Required<CreateVoiceMemo> = {
      durationMs: memo.durationMs,
      keptOutOfMemory: memo.keptOutOfMemory,
    };
    const form = new FormData();
    form.append('durationMs', String(fields.durationMs));
    /* A form sends text: exactly "true" or "false", as the API reads it. */
    form.append('keptOutOfMemory', String(fields.keptOutOfMemory));
    form.append(
      AUDIO_FIELD,
      new Blob([memo.audio], { type: memo.type }),
      'recording',
    );

    const result = await request<Entry>('/entries/voice', {
      method: 'POST',
      form,
    });

    /* Cleared while it was out: the person has signed out. */
    if (!audio.has(id)) {
      return;
    }

    if (result.kind === 'ok') {
      audio.delete(id);
      replace({
        id,
        durationMs: memo.durationMs,
        status: 'saved',
        entry: result.data,
      });
      return;
    }

    replace({ id, durationMs: memo.durationMs, status: 'notSaved' });
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async keep(memo, keptOutOfMemory) {
      const id = newId();

      audio.set(id, { ...memo, keptOutOfMemory });
      uploads = [
        ...uploads,
        { id, durationMs: memo.durationMs, status: 'saving' },
      ];
      publish();

      await send(id);
    },
    async retry(id) {
      const upload = uploads.find((each) => each.id === id);

      if (upload?.status !== 'notSaved') {
        return;
      }

      await send(id);
    },
    forget(id) {
      if (!uploads.some((upload) => upload.id === id)) {
        return;
      }

      audio.delete(id);
      uploads = uploads.filter((upload) => upload.id !== id);
      publish();
    },
    clear() {
      audio.clear();
      uploads = [];
      publish();
    },
  };
}

/*
 * The memos Today draws after its entries. One the day already shows is not
 * drawn twice, and a saved one that the API filed on another day (near
 * midnight) is not drawn on this one.
 */
export function uploadsShownOn(
  day: TodayState['day'],
  uploads: readonly Upload[],
): Upload[] {
  if (day.status !== 'open') {
    return [];
  }

  return uploads.filter(
    (upload) =>
      upload.status !== 'saved' ||
      (upload.entry.date === day.date &&
        !day.entries.some((entry) => entry.id === upload.entry.id)),
  );
}

/*
 * What ties the uploads to Today, for as long as Today is on the screen.
 *
 * A memo that has been saved makes Today ask the API for the day again, as
 * a saved entry does (ADR-021), and is asked about once. A question already
 * out may have been answered before the memo existed, so the new one waits
 * for it. Once the day holds the memo, or the API has filed it on another
 * day, it is forgotten here.
 *
 * Returns the function that unties them.
 */
export function followUploads(
  uploads: Uploads,
  today: {
    getState(): TodayState;
    subscribe(listener: () => void): () => void;
    look(): Promise<void>;
  },
): () => void {
  const askedAbout = new Set<string>();
  /* Forgetting a memo publishes, which would come back in here. */
  let settling = false;

  function settle(): void {
    const { day, asking } = today.getState();

    if (settling || asking || day.status !== 'open') {
      return;
    }

    settling = true;

    const saved = uploads
      .getState()
      .uploads.filter(
        (upload): upload is Extract<Upload, { status: 'saved' }> =>
          upload.status === 'saved',
      );

    for (const upload of saved) {
      const shown = day.entries.some((entry) => entry.id === upload.entry.id);

      if (shown || upload.entry.date !== day.date) {
        askedAbout.delete(upload.id);
        uploads.forget(upload.id);
      }
    }

    const notAsked = uploads
      .getState()
      .uploads.filter(
        (upload) => upload.status === 'saved' && !askedAbout.has(upload.id),
      );

    settling = false;

    if (notAsked.length > 0) {
      notAsked.forEach((upload) => askedAbout.add(upload.id));
      void today.look();
    }
  }

  const untieUploads = uploads.subscribe(settle);
  const untieToday = today.subscribe(settle);
  settle();

  return () => {
    untieUploads();
    untieToday();
  };
}
