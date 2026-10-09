'use client';

import Link from 'next/link';
import { Gate } from '@/app/components/Gate';
import { KeyBox } from '@/app/components/LiveScreen';
import { NotBuiltYet, useNotBuilt } from '@/app/components/NotBuilt';
import { useTodayDate } from '@/app/components/useTodayDate';

/*
 * The 128 bars of the comp's resting waveform: a flat line, which is what
 * silence looks like. It is the same drawing on every width.
 */
const RESTING_BARS = Array.from({ length: 128 }, (_, index) => 2 + index * 8);

/*
 * Talk, from the ready state of 03-talk.html: the page a voice memo is
 * recorded on. Recording is not scheduled (lib/unbuilt.ts). A press of
 * "Start recording" says so where the comp says what the microphone did,
 * and does nothing else. The microphone is never asked for.
 *
 * Every way out goes to Today, as the comp's do.
 *
 * Not drawn, because each says something that is not true yet: the status
 * "Ready", the date and time of the recording (a time would come from the
 * browser's clock, which never makes a date), and the comp's sentence that
 * "Stop and keep" returns to today. The places of the first two are kept,
 * empty. The controls for a recording in progress belong to its other
 * states.
 */
export function Talk() {
  return <Gate>{() => <Recorder />}</Gate>;
}

function Recorder() {
  const date = useTodayDate();
  const start = useNotBuilt('startRecording');

  return (
    <div className="app compact-recorder-app" data-recorder-phase="ready">
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
            <p className="printed">No recording has started.</p>
          </div>
          <div className="capture-intro">
            <h1>Voice memo</h1>
            <p className="printed">Start when you are ready.</p>
          </div>
          <div className="recording-sheet">
            <div className="session-line">
              {/* Where the comp says "Ready" and the time. They are kept,
                  empty, so that the clock stays where the comp puts it. */}
              <span className="session-state" />
              <span className="printed session-date" />
              <div className="clock-block">
                <span className="clock">0:00</span>
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
                  <span>Not started</span>
                </div>
              </div>
            </div>
            <div className="start-controls">
              <p className="printed">Nothing is being recorded yet.</p>
              <div className="start-control-group">
                <div className="transport-buttons">
                  <button
                    className="btn solid"
                    type="button"
                    onClick={start.press}
                    {...start.marker}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="8" y="3" width="8" height="12" rx="4" />
                      <path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8" />
                    </svg>
                    <span>{start.label}</span>
                  </button>
                  <Link className="btn keyline" href="/">
                    Cancel
                  </Link>
                </div>
                <div className="microphone-feedback">
                  {start.said ? <NotBuiltYet className="printed" /> : null}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
