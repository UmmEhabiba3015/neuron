'use client';

import { Mood } from '@neuron/contracts';
import Link from 'next/link';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { escapeCloses } from '@/lib/keys';
import { WAVEFORMS } from '@/lib/waveform';
import { NotBuiltYet } from '@/components/ui/NotBuilt';
import { useEnterToSave } from '@/hooks/useEnterToSave';
import { useNotBuilt } from '@/hooks/useNotBuilt';

/*
 * What the editor of an entry draws, worked out from lib/today.ts by the
 * sheet. `line` is the request in flight; `problem` is a save that failed
 * or was refused; `blank` says the problem is the text itself.
 */
export interface EntryEditor {
  text: string;
  saving: boolean;
  line?: string;
  problem?: string;
  blank: boolean;
}

/*
 * An entry on a day's page, with the controls that edit and delete it.
 *
 * The edit icon opens the editor in the entry's own row, in place of its
 * words and its icons, as #entry-edit in journal-prototype.html draws it.
 * What it holds and what a press does are decided in lib/today.ts. Opening
 * it moves focus into its text box; closing it, by Save changes, Cancel or
 * Escape, returns focus to the edit icon. Neither scrolls the page.
 *
 * "Keep this out of memory" is feature 9's. Its menu is drawn under the
 * icons, as #entry-options draws it, and opens as the comp's does. An entry
 * that is not kept out is in memory (docs/features.md, Ref 25), so the
 * menu says "In memory" and its one option is pressed. A press of the
 * option says so in the row, as edit does, and changes nothing.
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
  editor,
  onEdit,
  onEditType,
  onEditSave,
  onEditCancel,
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
  /* The editor, while this entry is being edited. */
  editor?: EntryEditor;
  onEdit: () => void;
  onEditType: (text: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}) {
  const sentence = useId();
  const textBox = useId();
  const editSentence = useId();
  const row = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLButtonElement>(null);
  const editIcon = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const memory = useNotBuilt('entryMemory');
  const enterToSave = useEnterToSave(onEditSave);

  const editing = editor !== undefined;
  const wasEditing = useRef(editing);

  /*
   * The editor has opened: focus goes into its text box, with the cursor
   * after the last word. It has closed: focus returns to the edit icon, if
   * it was in this row or was lost when the editor left the page. Neither
   * scrolls, so the reader stays where they were (docs/features.md, Ref 14).
   */
  useEffect(() => {
    const opened = !wasEditing.current && editing;
    const closed = wasEditing.current && !editing;
    wasEditing.current = editing;

    if (opened && field.current) {
      const end = field.current.value.length;

      field.current.focus({ preventScroll: true });
      field.current.setSelectionRange(end, end);
      return;
    }

    if (!closed) {
      return;
    }

    const focused = document.activeElement;

    if (focused === document.body || row.current?.contains(focused)) {
      editIcon.current?.focus({ preventScroll: true });
    }
  }, [editing]);

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
        {editor ? (
          <form
            className="entry-editor"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              onEditSave();
            }}
            onKeyDown={(event) => {
              const press = {
                key: event.key,
                shiftKey: event.shiftKey,
                isComposing: event.nativeEvent.isComposing,
              };

              if (escapeCloses(press)) {
                event.preventDefault();
                onEditCancel();
              }
            }}
          >
            <label htmlFor={textBox}>
              Entry text
              <textarea
                className="field"
                id={textBox}
                rows={5}
                ref={field}
                required
                readOnly={editor.saving}
                value={editor.text}
                aria-invalid={editor.blank ? true : undefined}
                aria-describedby={editor.problem ? editSentence : undefined}
                onChange={(event) => onEditType(event.target.value)}
                onKeyDown={enterToSave}
              />
            </label>
            {editor.problem ? (
              <p
                className="auth-help state-message"
                id={editSentence}
                role="alert"
              >
                {editor.problem}
              </p>
            ) : editor.line ? (
              <p className="auth-help state-message" role="status">
                {editor.line}
              </p>
            ) : null}
            <div className="auth-actions">
              <button className="btn solid" type="submit">
                Save changes
              </button>
              <button
                className="btn quiet"
                type="button"
                onClick={onEditCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="prose">{children}</p>
        )}
        {editor ? null : panel ? (
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
                ref={editIcon}
                data-entry-action="edit"
                aria-label="Edit entry"
                onClick={onEdit}
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
                  <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" />
                </svg>
              </button>
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
            <details className="entry-memory-dropdown" data-excluded="false">
              <summary
                className="entry-memory-trigger"
                aria-label="Entry memory settings: in memory"
              >
                <span className="memory-state">In memory</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="entry-memory-menu">
                <button
                  className="opt"
                  type="button"
                  data-entry-action="memory"
                  aria-pressed="true"
                  onClick={memory.press}
                  {...memory.marker}
                >
                  <span className="tick" aria-hidden="true" />
                  <span>{memory.label}</span>
                </button>
              </div>
            </details>
          </div>
        )}
        {memory.said && !panel && !editor ? (
          <NotBuiltYet className="auth-help state-message" />
        ) : null}
      </div>
    </div>
  );
}

/*
 * The words are the contract's, in the contract's order. lock.css finds each
 * one's colour by the word in small letters.
 *
 * Which word is chosen is decided in lib/today.ts, and is already the new
 * one by the time a press is drawn. It is said with `aria-pressed`, so a
 * screen reader hears "pressed" and does not need the colour. Each word is
 * the same button before and after a press, so focus stays on it.
 *
 * `problem` is a press that failed. It is drawn directly under the words,
 * where 18-entry-system-states.html draws `mood-failed`.
 */
export function MoodRow({
  label,
  chosen,
  problem,
  onPress,
}: {
  /* "Today felt" on Today, and "Day felt" on any other day. */
  label: string;
  chosen: Mood | null;
  problem?: string;
  onPress: (mood: Mood) => void;
}) {
  return (
    <section className="moodrow ruled-mood">
      <div className="tcol">
        <h2>{label}</h2>
      </div>
      <div className="ccol">
        <div className="chips" role="group" aria-label="How was this day?">
          {Object.values(Mood).map((mood) => (
            <button
              key={mood}
              type="button"
              data-mood={mood.toLowerCase()}
              aria-pressed={mood === chosen}
              onClick={() => onPress(mood)}
            >
              {mood}
            </button>
          ))}
        </div>
        {problem ? (
          <p className="auth-help state-message" role="alert">
            {problem}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/*
 * The field, and Save once the field holds words. On a computer Enter
 * saves too, and on a phone it starts a new line (lib/keys.ts). With no words there is
 * nothing to save, and the microphone stands in Save's place, as the comp's
 * does: it leads to Talk. Neither the field nor the button is ever
 * disabled; a second press while a save is in flight is stopped in
 * lib/today.ts.
 *
 * Under the field, as 01-today.html draws them: "Keep this out of memory",
 * which is not scheduled (lib/unbuilt.ts), and "More options", which leads
 * to the composer's options. The option is not pressed, because nothing is
 * kept out of memory.
 *
 * `line` is the request in flight and `problem` is a save that failed. Both
 * are drawn where 18-entry-system-states.html draws `save-failed`, and so is
 * the sentence when the memory option is pressed.
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
  const field = useRef<HTMLTextAreaElement>(null);
  const hadButton = useRef(holdsWords);
  const memory = useNotBuilt('composerMemory');
  const enterToSave = useEnterToSave(onSave);

  /*
   * A save that succeeds empties the field, and Save leaves the page. If
   * the keyboard's focus was on Save, it would be left on nothing, so it is
   * moved to the field, which is where the next entry is typed.
   */
  useEffect(() => {
    const left = hadButton.current && !holdsWords;
    hadButton.current = holdsWords;

    if (left && document.activeElement === document.body) {
      field.current?.focus();
    }
  }, [holdsWords]);

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
          ref={field}
          aria-label="Add to today"
          placeholder="Add to today"
          value={text}
          onChange={(event) => onType(event.target.value)}
          onKeyDown={enterToSave}
        />
        {holdsWords ? (
          <button className="send" type="submit" aria-label="Save entry">
            Save
          </button>
        ) : (
          <Link className="mic" href="/talk" aria-label="Record">
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
          </Link>
        )}
      </form>
      <div className="composer-tools">
        <button
          className="opt"
          type="button"
          aria-pressed="false"
          onClick={memory.press}
          {...memory.marker}
        >
          <span className="tick" aria-hidden="true" /> {memory.label}
        </button>
        <Link className="btn quiet" href="/options">
          More options
        </Link>
      </div>
      {problem ? (
        <p className="auth-help state-message" role="alert">
          {problem}
        </p>
      ) : line ? (
        <p className="auth-help state-message" role="status">
          {line}
        </p>
      ) : memory.said ? (
        <NotBuiltYet className="auth-help state-message" />
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
