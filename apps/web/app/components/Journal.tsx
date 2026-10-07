'use client';

import { MOODS } from '@neuron/contracts';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { WAVEFORMS } from '@/lib/waveform';

/*
 * The entry on Today, with the control that deletes it.
 *
 * At rest the row holds the designer's icon. While the person is being asked,
 * or after a delete has failed, the icon's place is taken by a panel with a
 * sentence and two buttons (18-entry-system-states.html). Which of the three
 * it is, is decided in lib/today.ts.
 *
 * The icon and the panel are different elements, so the keyboard's focus is
 * moved by hand each time one replaces the other:
 *
 *   the icon is pressed     focus goes to "Keep entry", the safe answer, so
 *                           a second press of the same key keeps the entry
 *   "Keep entry" is pressed focus returns to the icon
 *
 * Where focus goes after "Delete entry" is the screen's to decide, because
 * this row is no longer there (LiveToday.tsx).
 */
export function LiveEntry({
  id,
  time,
  datetime,
  children,
  confirming,
  notDeleted,
  onAsk,
  onKeep,
  onGoAhead,
}: {
  id: string;
  time: string;
  datetime: string;
  children: ReactNode;
  confirming: boolean;
  notDeleted?: string;
  onAsk: () => void;
  onKeep: () => void;
  onGoAhead: () => void;
}) {
  const sentence = useId();
  const row = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);

  const panel = confirming || notDeleted !== undefined;
  const hadPanel = useRef(panel);

  /*
   * The panel has closed and the icon is back. Focus is taken only if it was
   * in this row, or was lost when the panel's button left the page. If the
   * person has moved on to something else, it stays with them.
   */
  useEffect(() => {
    const closed = hadPanel.current && !panel;
    hadPanel.current = panel;

    if (!closed) {
      return;
    }

    const focused = document.activeElement;

    if (focused === document.body || row.current?.contains(focused)) {
      icon.current?.focus();
    }
  }, [panel]);

  /*
   * A failed delete opens the panel too, and takes no focus: the person did
   * not press anything just then, and may be typing.
   */
  useEffect(() => {
    if (confirming) {
      keep.current?.focus();
    }
  }, [confirming]);

  return (
    <div className="srow" ref={row} data-entry-id={id}>
      <div className="tcol">
        <time dateTime={datetime}>{time}</time>
      </div>
      <div className="ccol">
        <p className="prose">{children}</p>
        {panel ? (
          <div className="entry-confirm">
            <p id={sentence} role={confirming ? undefined : 'alert'}>
              {confirming
                ? 'Delete this entry? This cannot be undone.'
                : notDeleted}
            </p>
            <div className="auth-actions">
              <button
                className="btn quiet"
                type="button"
                aria-describedby={sentence}
                onClick={confirming ? onGoAhead : onAsk}
              >
                {confirming ? 'Delete entry' : 'Try again'}
              </button>
              <button
                className="btn solid"
                type="button"
                ref={keep}
                aria-describedby={sentence}
                onClick={onKeep}
              >
                Keep entry
              </button>
            </div>
          </div>
        ) : (
          <div className="entry-actions" aria-label="Entry actions">
            <div className="entry-tools">
              <button
                className="btn quiet entry-icon"
                type="button"
                ref={icon}
                data-entry-action="delete"
                aria-label="Delete entry"
                onClick={onAsk}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * The words are the contract's, in the contract's order. lock.css finds each
 * one's colour by the word in small letters.
 */
export function MoodRow() {
  return (
    <section className="moodrow ruled-mood">
      <div className="tcol">
        <h2>Today felt</h2>
      </div>
      <div className="ccol">
        <div className="chips" role="group" aria-label="How was this day?">
          {MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              data-mood={mood.toLowerCase()}
              aria-pressed="false"
            >
              {mood}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/*
 * One control, two states (direction-lock.md 7.4): the record control while
 * the field holds no words, and Save once it does. It is one button element
 * throughout. Neither it nor the field is ever disabled; a second press while
 * a save is in flight is stopped in lib/today.ts.
 *
 * `line` is the request in flight and `problem` is a save that failed. Both
 * are drawn where 18-entry-system-states.html draws `save-failed`.
 */
export function LiveComposer({
  text,
  holdsWords,
  line,
  problem,
  onType,
  onSave,
}: {
  text: string;
  holdsWords: boolean;
  line?: string;
  problem?: string;
  onType: (text: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="composer writing-companion">
      <form
        className="crow"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        {/* The placeholder disappears on focus, so it cannot be the field's
            only name (direction-lock.md 7.4, build obligation 1). */}
        <textarea
          className="field"
          rows={1}
          aria-label="Add to today"
          placeholder="Add to today"
          value={text}
          onChange={(event) => onType(event.target.value)}
        />
        <button
          className={holdsWords ? 'send' : 'mic'}
          type={holdsWords ? 'submit' : 'button'}
          aria-label={holdsWords ? 'Save entry' : 'Record'}
        >
          {holdsWords ? (
            'Save'
          ) : (
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
          )}
        </button>
      </form>
      <div className="composer-tools">
        <button className="opt" type="button" aria-pressed="false">
          <span className="tick" aria-hidden="true" />
          Keep this out of memory
        </button>
      </div>
      {problem ? (
        <p className="auth-help state-message" role="alert">
          {problem}
        </p>
      ) : line ? (
        <p className="auth-help state-message" role="status">
          {line}
        </p>
      ) : null}
    </div>
  );
}

/*
 * All three authored waveforms. live.css shows the one that matches the
 * width; see the note there and direction-lock.md 12.7.
 */
export function LiveWaveform() {
  return (
    <>
      {(['mobile', 'tablet', 'desktop'] as const).map((platform) => {
        const { width, height, ticks } = WAVEFORMS[platform];
        return (
          <svg
            key={platform}
            className="wave"
            data-w={platform}
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
      })}
    </>
  );
}

export function LiveRecording({
  time,
  datetime,
  duration,
  label,
  children,
}: {
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
          <LiveWaveform />
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

export function SourceMark({ source }: { source: string }) {
  return <span className="mark">{source}</span>;
}

export function Segmented({
  label,
  options,
  active,
}: {
  label: string;
  options: string[];
  active: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === active ? 'true' : 'false'}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
