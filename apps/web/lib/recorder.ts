/*
 * The recorder of Talk: what it shows, and what each press does to it.
 *
 * Like today.ts, this file is tested with Node alone. The two things that
 * only a browser has are handed in: the microphone, through the thin wrapper
 * in microphone.ts, and the clock. The component draws what `getState()`
 * says and decides nothing.
 *
 * Her decisions, 2026-10-16:
 *
 *   At the longest a memo may be, the recorder stops and keeps, and says so.
 *   Cancel asks first, and the recording goes on while it asks.
 *   Stop and keep hands the memo to the uploads (uploads.ts), and the screen
 *   returns to Today.
 *
 * Leaving the page while recording stops and keeps the memo, as the comp
 * says it does: nothing that was recorded is lost by a press of Back.
 *
 * The waveform is a static picture (features.md, Ref 22), so nothing here
 * listens to the sound.
 */

/* One recording in progress, as the wrapper hands it over. */
export interface Capture {
  /* The MIME type the browser records in, codec included if it says one. */
  readonly type: string;
  pause(): void;
  resume(): void;
  /* Ends the recording, lets go of the microphone, and gives its audio. */
  stop(): Promise<Blob>;
  /* Ends the recording, lets go of the microphone, and drops its audio. */
  discard(): void;
}

/*
 * What the screen says when there is no recording. `denied` is a refused
 * microphone, `missing` a device with none.
 */
export type MicrophoneRefusal = 'denied' | 'missing';

export type Started =
  | { kind: 'started'; capture: Capture }
  | { kind: 'refused'; why: MicrophoneRefusal };

export interface Microphone {
  /* Asks for the microphone, and starts recording once it is given. */
  start(): Promise<Started>;
}

export interface Clock {
  now(): number;
  /* Each returns the function that stops it. */
  every(milliseconds: number, run: () => void): () => void;
  after(milliseconds: number, run: () => void): () => void;
}

/* A memo that has been kept, ready to be sent. */
export interface Kept {
  audio: Blob;
  type: string;
  durationMs: number;
}

/*
 * `ready`      nothing is being recorded. `microphone` is what the last
 *              press of Start came to: `asking` while the browser asks.
 * `recording`, `paused`
 *              `elapsedMs` counts recorded time only, not paused time.
 *              `confirmingCancel` is the question "Discard this recording?"
 * `keeping`    Stop and keep has been pressed, or the limit reached, and the
 *              browser is handing over the audio.
 * `kept`       the memo has gone to the uploads. `byLimit` says whether it
 *              was the limit that stopped it.
 * `discarded`  the person said Discard.
 */
export type RecorderState =
  | { phase: 'ready'; microphone: 'idle' | 'asking' | MicrophoneRefusal }
  | {
      phase: 'recording' | 'paused';
      elapsedMs: number;
      confirmingCancel: boolean;
    }
  | { phase: 'keeping'; byLimit: boolean; elapsedMs: number }
  | { phase: 'kept'; byLimit: boolean; durationMs: number }
  | { phase: 'discarded' };

export interface Recorder {
  getState(): RecorderState;
  subscribe(listener: () => void): () => void;
  /* A press while the browser is asking, or while recording, does nothing. */
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  stopAndKeep(): Promise<void>;
  /* Asks "Discard this recording?" The recording goes on meanwhile. */
  cancel(): void;
  /* The answer "Keep recording". */
  keepRecording(): void;
  /* The answer "Discard". */
  discard(): void;
  /* The page is going away. A recording is kept; a question is dropped. */
  leave(): void;
}

/* How often the running time is drawn again. Its smallest unit is a second. */
export const TICK_MILLISECONDS = 250;

/*
 * Which refusal an error from getUserMedia is. A device with no microphone,
 * or none that fits, is `missing`; anything else stops the browser from
 * using one it has, and is `denied`.
 */
export function microphoneRefusal(errorName: string): MicrophoneRefusal {
  return errorName === 'NotFoundError' || errorName === 'OverconstrainedError'
    ? 'missing'
    : 'denied';
}

export function createRecorder(config: {
  microphone: Microphone;
  clock: Clock;
  /* Where a kept memo goes: the uploads. */
  keep: (kept: Kept) => void;
  /* The longest a memo may be. */
  maxMilliseconds: number;
}): Recorder {
  const { microphone, clock, keep, maxMilliseconds } = config;

  let state: RecorderState = { phase: 'ready', microphone: 'idle' };
  const listeners = new Set<() => void>();

  let capture: Capture | undefined;
  /* Recorded time before the current stretch of recording began. */
  let banked = 0;
  /* When the current stretch began, while recording. */
  let since: number | undefined;
  let confirmingCancel = false;
  let left = false;

  let stopTicking: (() => void) | undefined;
  let stopLimit: (() => void) | undefined;

  function elapsed(): number {
    return Math.min(
      maxMilliseconds,
      banked + (since === undefined ? 0 : clock.now() - since),
    );
  }

  function set(next: RecorderState): void {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function show(phase: 'recording' | 'paused'): void {
    set({ phase, elapsedMs: elapsed(), confirmingCancel });
  }

  function stopTimers(): void {
    stopTicking?.();
    stopLimit?.();
    stopTicking = undefined;
    stopLimit = undefined;
  }

  function run(): void {
    since = clock.now();
    stopTicking = clock.every(TICK_MILLISECONDS, () => show('recording'));
    stopLimit = clock.after(maxMilliseconds - banked, () => {
      void finish(true);
    });
    show('recording');
  }

  function hold(): void {
    banked = elapsed();
    since = undefined;
    stopTimers();
  }

  async function start(): Promise<void> {
    if (state.phase !== 'ready' || state.microphone === 'asking') {
      return;
    }

    set({ phase: 'ready', microphone: 'asking' });

    const started = await microphone.start();

    if (started.kind === 'refused') {
      left = false;
      set({ phase: 'ready', microphone: started.why });
      return;
    }

    /* The page went while the browser was asking: nothing was meant. */
    if (left) {
      left = false;
      started.capture.discard();
      set({ phase: 'ready', microphone: 'idle' });
      return;
    }

    capture = started.capture;
    banked = 0;
    confirmingCancel = false;
    run();
  }

  function pause(): void {
    if (state.phase !== 'recording' || !capture) {
      return;
    }

    capture.pause();
    hold();
    show('paused');
  }

  function resume(): void {
    if (state.phase !== 'paused' || !capture) {
      return;
    }

    capture.resume();
    run();
  }

  async function finish(byLimit: boolean): Promise<void> {
    if ((state.phase !== 'recording' && state.phase !== 'paused') || !capture) {
      return;
    }

    const ending = capture;
    capture = undefined;
    hold();

    /*
     * A memo is at least a millisecond long, because the API refuses
     * nothing at all. The limit's own timer can fire a moment late, so the
     * length is never more than the limit either. The clock can count in
     * fractions of a millisecond (performance.now() in Chromium), and the
     * API takes only whole ones, so the length is rounded here, once.
     */
    const durationMs = Math.min(
      maxMilliseconds,
      Math.max(1, Math.round(byLimit ? maxMilliseconds : banked)),
    );
    confirmingCancel = false;
    set({ phase: 'keeping', byLimit, elapsedMs: durationMs });

    const audio = await ending.stop();

    keep({ audio, type: audio.type || ending.type, durationMs });
    set({ phase: 'kept', byLimit, durationMs });
  }

  function cancel(): void {
    if (state.phase !== 'recording' && state.phase !== 'paused') {
      return;
    }

    confirmingCancel = true;
    show(state.phase);
  }

  function keepRecording(): void {
    if (state.phase !== 'recording' && state.phase !== 'paused') {
      return;
    }

    confirmingCancel = false;
    show(state.phase);
  }

  function discard(): void {
    if (
      (state.phase !== 'recording' && state.phase !== 'paused') ||
      !confirmingCancel ||
      !capture
    ) {
      return;
    }

    capture.discard();
    capture = undefined;
    hold();
    confirmingCancel = false;
    set({ phase: 'discarded' });
  }

  function leave(): void {
    if (state.phase === 'ready' && state.microphone === 'asking') {
      left = true;
      return;
    }

    void finish(false);
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start,
    pause,
    resume,
    stopAndKeep: () => finish(false),
    cancel,
    keepRecording,
    discard,
    leave,
  };
}
