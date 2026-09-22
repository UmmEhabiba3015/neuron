import type { ReactNode } from 'react';
import { WAVEFORMS } from '@/lib/waveform';
import type { Platform } from '@/lib/platform';

export function Entry({
  time,
  datetime,
  children,
  mark,
}: {
  time?: string;
  datetime?: string;
  children: ReactNode;
  mark?: ReactNode;
}) {
  return (
    <div className="srow">
      <div className="tcol">
        {time ? <time dateTime={datetime}>{time}</time> : null}
      </div>
      <div className="ccol">
        <p className="prose">{children}</p>
        {mark}
      </div>
    </div>
  );
}

export function PrivateMark() {
  return (
    <span className="mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="1" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      Private, out of memory
    </span>
  );
}

export function Note({
  children,
  citation,
}: {
  children: ReactNode;
  citation: string;
}) {
  return (
    <aside className="said" aria-label="From your record">
      <div className="tcol">From your record</div>
      <div className="ccol">
        <details>
          <summary>
            <span className="lblbox">
              <span className="lbl shut">Read the note</span>{' '}
              <span className="lbl open">Hide the note</span>
            </span>
            <svg
              className="chev"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <div className="note">
            <p>{children}</p>
            <div className="said-foot">
              <a className="cite" href="#">
                {citation}
              </a>
              <button className="wrong" type="button">
                That&apos;s not right
              </button>
            </div>
          </div>
        </details>
      </div>
    </aside>
  );
}

export function Waveform({ platform }: { platform: Platform }) {
  const { width, height, ticks } = WAVEFORMS[platform];

  return (
    <svg
      className="wave"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g fill="currentColor">
        {ticks.map(([x, y, h]) => (
          <rect key={x} x={x} y={y} width="2" height={h} />
        ))}
      </g>
    </svg>
  );
}

export function Recording({
  platform,
  time,
  datetime,
  duration,
  label,
  children,
}: {
  platform: Platform;
  time: string;
  datetime: string;
  duration: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="recrow">
      <div className="head dated">
        <div className="tcol">
          <time dateTime={datetime}>{time}</time>
        </div>
        <div className="ccol">
          <button className="play" type="button" aria-label={label}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
          <Waveform platform={platform} />
          <span className="dur">{duration}</span>
        </div>
      </div>
      {children ? (
        <div className="body">
          <div className="tcol" />
          <div className="ccol">
            <p className="prose">{children}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const MOODS = ['Hard', 'Low', 'Even', 'Good', 'Light'] as const;

export function MoodRow() {
  return (
    <section className="moodrow">
      <h2>How was today?</h2>
      <div className="chips">
        {MOODS.map((mood) => (
          <button key={mood} type="button" aria-pressed="false">
            {mood}
          </button>
        ))}
      </div>
    </section>
  );
}

export function Composer({
  placeholder = 'Add to today',
  draft,
}: {
  placeholder?: string;
  draft?: string;
}) {
  return (
    <div className="composer">
      <div className="crow">
        <div className={draft ? 'field' : 'field placeholder'}>
          {draft ?? placeholder}
        </div>
        <button className="mic" type="button" aria-label="Record">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
            <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
            <path d="M12 18v3.5" />
          </svg>
        </button>
      </div>
      <button className="opt" type="button" aria-pressed="false">
        <span className="tick" aria-hidden="true" />
        Keep this out of memory
      </button>
    </div>
  );
}
