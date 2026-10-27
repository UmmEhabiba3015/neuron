'use client';

import { VOICE_MEMO_MAX_MINUTES } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Gate } from '@/components/layout/Gate';
import { KeyBox } from '@/components/layout/LiveScreen';
import { useTodayDate } from '@/hooks/useTodayDate';
import { uploads } from '@/lib/api/client';
import { browserMicrophone } from '@/lib/microphone';
import {
  createRecorder,
  type MicrophoneRefusal,
  type RecorderState,
} from '@/lib/recorder';
import { systemClock } from '@/lib/utils/clock';
import { formatDuration } from '@/lib/utils/format';

/*
 * The 128 bars of the comp's resting waveform: a flat line. The waveform is
 * a static picture (features.md, Ref 22), so it is this line in every state,
 * as the comp draws it in #s-recording-paused too.
 */
const RESTING_BARS = Array.from({ length: 128 }, (_, index) => 2 + index * 8);

const MAX_MILLISECONDS = VOICE_MEMO_MAX_MINUTES * 60 * 1000;

/* Her words, 2026-10-16. */
const REFUSED: Record<MicrophoneRefusal, string> = {
  denied:
    "Neuron cannot use your microphone. Allow it in your browser's settings for this site, then try again.",
  missing: 'No microphone was found on this device.',
};
const KEPT_AT_LIMIT = `Recordings stop at ${VOICE_MEMO_MAX_MINUTES} minutes. This one has been kept.`;
const DISCARD_QUESTION = 'Discard this recording?';

/*
 * Talk: the page a voice memo is recorded on, from the comp's recorder
 * states (#talk, #microphone-before, -denied, -missing, #s-recording-paused
 * in journal-prototype.html). What each press does is decided in
 * lib/recorder.ts; this draws it.
 *
 *   Stop and keep   the memo goes to the uploads and the screen returns to
 *                   Today, where it is a row at the bottom while it is sent.
 *   Cancel          asks first; Discard returns to Today with nothing kept.
 *   At the limit    the memo is kept, and the page says so and stays.
 *   Leaving         by Back, the wordmark or "Today", stops and keeps.
 *
 * The date and time of the recording are not drawn: a time would come from
 * the browser's clock, which never makes a date. Their place is kept, empty.
 * No control is ever disabled; a press that cannot do anything does nothing.
 */
export function Talk() {
  return <Gate>{() => <Recorder />}</Gate>;
}

function Recorder() {
  const date = useTodayDate();
  const router = useRouter();

  const [recorder] = useState(() =>
    createRecorder({
      microphone: browserMicrophone(),
      clock: systemClock,
      keep: (memo) => void uploads.keep(memo),
      maxMilliseconds: MAX_MILLISECONDS,
    }),
  );
  const view = useSyncExternalStore(
    recorder.subscribe,
    recorder.getState,
    recorder.getState,
  );

  /* The page is going away: a recording in progress is kept. */
  useEffect(() => () => recorder.leave(), [recorder]);

  const backToToday =
    (view.phase === 'kept' && !view.byLimit) || view.phase === 'discarded';

  useEffect(() => {
    if (backToToday) {
      router.push('/');
    }
  }, [backToToday, router]);

  const running = view.phase === 'recording' || view.phase === 'paused';
  const elapsed =
    view.phase === 'kept'
      ? view.durationMs
      : view.phase === 'ready' || view.phase === 'discarded'
        ? 0
        : view.elapsedMs;

  return (
    <div
      className="app compact-recorder-app"
      data-recorder-phase={view.phase === 'paused' ? 'paused' : 'ready'}
    >
      <div className="rail" aria-hidden="true" />
      <div className="recorder-page">
        <header className="recorder-mast">
          <Link className="wordmark" href="/">
            Journal
          </Link>
          <KeyBox label="Today" value={date} />
        </header>
        <main className="compact-recorder">
          <div className="capture-back">
            <Link className="recorder-back" href="/">
              <span aria-hidden="true">←</span> Today
            </Link>
            <p className="printed">
              {view.phase === 'ready'
                ? 'No recording has started.'
                : running
                  ? 'Leaving this page stops and keeps your memo.'
                  : null}
            </p>
          </div>
          <div className="capture-intro">
            <h1>Voice memo</h1>
            <p className="printed">
              Start when you are ready. Stop and keep returns to today.
            </p>
          </div>
          <div className="recording-sheet">
            <div className="session-line">
              <span className="session-state" role="status">
                {view.phase === 'recording'
                  ? 'Recording'
                  : view.phase === 'paused'
                    ? 'Paused'
                    : null}
              </span>
              <span className="printed session-date" />
              <div className="clock-block">
                <span
                  className="clock"
                  role="timer"
                  aria-label="Elapsed recording time"
                >
                  {formatDuration(elapsed)}
                </span>
                <span className="printed">Time recorded</span>
              </div>
            </div>
            <div className="recording-field">
              <div className="wave-area">
                <svg
                  className="recorder-wave"
                  viewBox="0 0 1024 180"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  {RESTING_BARS.map((x) => (
                    <g key={x} style={{ transform: 'scaleY(.015)' }}>
                      <rect
                        x={x}
                        y="10"
                        width="4"
                        height="160"
                        fill="currentColor"
                      />
                    </g>
                  ))}
                </svg>
                <div className="wave-axis" aria-hidden="true">
                  <span>Start</span>
                  <span>{view.phase === 'ready' ? 'Not started' : 'Now'}</span>
                </div>
              </div>
            </div>
            <Controls view={view} recorder={recorder} />
          </div>
        </main>
      </div>
    </div>
  );
}

type RecorderStore = ReturnType<typeof createRecorder>;

/*
 * The bottom of the sheet. Each state replaces the buttons of the one before,
 * so focus is moved by hand to where the next press is expected: the start
 * of a recording to Stop and keep, the question to Keep recording, its
 * answer back to Cancel, and the limit to the way back to Today.
 */
function Controls({
  view,
  recorder,
}: {
  view: RecorderState;
  recorder: RecorderStore;
}) {
  const keepButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const keepRecordingButton = useRef<HTMLButtonElement>(null);
  const returnLink = useRef<HTMLAnchorElement>(null);

  const confirming =
    (view.phase === 'recording' || view.phase === 'paused') &&
    view.confirmingCancel;
  const wasConfirming = useRef(confirming);
  const startedAt = view.phase === 'recording' || view.phase === 'paused';
  const wasStarted = useRef(startedAt);
  const atLimit = view.phase === 'kept' && view.byLimit;

  useEffect(() => {
    const started = !wasStarted.current && startedAt;
    const answered = wasConfirming.current && !confirming;
    wasStarted.current = startedAt;
    wasConfirming.current = confirming;

    if (confirming) {
      keepRecordingButton.current?.focus();
    } else if (answered) {
      cancelButton.current?.focus();
    } else if (started) {
      keepButton.current?.focus();
    }
  }, [confirming, startedAt]);

  useEffect(() => {
    if (atLimit) {
      returnLink.current?.focus();
    }
  }, [atLimit]);

  if (view.phase === 'ready') {
    const refused =
      view.microphone === 'denied' || view.microphone === 'missing'
        ? view.microphone
        : undefined;

    return (
      <div className="start-controls">
        <p className="printed">Nothing is being recorded yet.</p>
        <div className="start-control-group">
          <div className="transport-buttons">
            <button
              className="btn solid"
              type="button"
              onClick={() => void recorder.start()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="8" y="3" width="8" height="12" rx="4" />
                <path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8" />
              </svg>
              <span>Start recording</span>
            </button>
            <Link className="btn keyline" href="/">
              Cancel
            </Link>
          </div>
          <div className="microphone-feedback">
            {view.microphone === 'asking' ? (
              <p className="printed" role="status">
                Waiting for microphone access.
              </p>
            ) : refused ? (
              <>
                <p className="printed" role="alert">
                  {REFUSED[refused]}
                </p>
                <button
                  className="btn quiet"
                  type="button"
                  onClick={() => void recorder.start()}
                >
                  Try again
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (atLimit) {
    return (
      <div className="transport">
        <p className="printed" role="status">
          {KEPT_AT_LIMIT}
        </p>
        <div className="transport-buttons">
          <Link className="btn solid" href="/" ref={returnLink}>
            Return to Today
          </Link>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="transport">
        <p className="printed" id="discard-question">
          {DISCARD_QUESTION}
        </p>
        <div className="transport-buttons">
          <button
            className="btn solid"
            type="button"
            ref={keepRecordingButton}
            aria-describedby="discard-question"
            onClick={recorder.keepRecording}
          >
            Keep recording
          </button>
          <button
            className="btn keyline"
            type="button"
            aria-describedby="discard-question"
            onClick={recorder.discard}
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  const paused = view.phase === 'paused';

  return (
    <div className="transport">
      <p className="printed">
        {paused
          ? 'Your memo is paused. Resume whenever you are ready.'
          : 'Take your time. Pauses belong here too.'}
      </p>
      <div className="transport-buttons">
        <button
          className="btn solid"
          type="button"
          ref={keepButton}
          onClick={() => void recorder.stopAndKeep()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
          <span>Stop and keep</span>
        </button>
        <button
          className="btn keyline"
          type="button"
          onClick={paused ? recorder.resume : recorder.pause}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {paused ? <path d="m9 5 11 7-11 7Z" /> : <path d="M8 5v14M16 5v14" />}
          </svg>
          <span>{paused ? 'Resume' : 'Pause'}</span>
        </button>
        <button
          className="btn quiet"
          type="button"
          ref={cancelButton}
          onClick={recorder.cancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
