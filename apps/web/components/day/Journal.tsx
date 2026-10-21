'use client';

import { Mood, type Entry } from '@neuron/contracts';
import Link from 'next/link';
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  useState,
  type RefObject,
} from 'react';
import { escapeCloses } from '@/lib/keys';
import { WAVEFORMS } from '@/lib/waveform';
import { session } from '@/lib/api/client';
import {
  createPlayback,
  type NotPlayed,
  type Playback,
  type PlaybackState,
} from '@/lib/playback';
import type { Upload } from '@/lib/uploads';
import { formatDuration, formatTime, speakDuration } from '@/lib/utils/format';
import { NotBuiltYet } from '@/components/ui/NotBuilt';
import { enterToSaveHandler } from './enterToSaveHandler';
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
 * The icons, the memory menu and the panel that asks before a delete are
 * EntryTools, below, which a voice memo draws too.
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
  const textBox = useId();
  const editSentence = useId();
  const row = useRef<HTMLDivElement>(null);
  const editIcon = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const enterToSave = enterToSaveHandler(onEditSave);

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
        {editor ? null : (
          <EntryTools
            row={row}
            what="entry"
            confirming={confirming}
            notDeleted={notDeleted}
            onAsk={onAsk}
            onKeep={onKeep}
            onGoAhead={onGoAhead}
            editIcon={editIcon}
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  );
}

/*
 * What sits beside an entry's words, or under a voice memo: at rest the
 * designer's icons and the memory menu, and while the person is being asked,
 * or after a delete has failed, a panel with a sentence and two buttons in
 * their place (18-entry-system-states.html). Which of the three it is, is
 * decided in lib/today.ts.
 *
 * A voice memo has no edit icon (features.md, Ref 11), so `onEdit` is left
 * out for one.
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
function EntryTools({
  row,
  what,
  confirming,
  notDeleted,
  onAsk,
  onKeep,
  onGoAhead,
  editIcon,
  onEdit,
}: {
  row: RefObject<HTMLDivElement | null>;
  what: 'entry' | 'memo';
  confirming: boolean;
  notDeleted?: string;
  onAsk: () => void;
  onKeep: () => void;
  onGoAhead: () => void;
  editIcon?: RefObject<HTMLButtonElement | null>;
  onEdit?: () => void;
}) {
  const sentence = useId();
  const icon = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const memory = useNotBuilt('entryMemory');
  const name = what === 'memo' ? 'Voice memo' : 'Entry';

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
  }, [panel, row]);

  /*
   * A failed delete opens the panel too, and takes no focus: the person did
   * not press anything just then, and may be typing.
   */
  useEffect(() => {
    if (confirming) {
      keep.current?.focus();
    }
  }, [confirming]);

  if (panel) {
    return (
      <div className="entry-confirm">
        <p id={sentence} role={confirming ? undefined : 'alert'}>
          {confirming ? 'Delete this entry? This cannot be undone.' : notDeleted}
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
    );
  }

  return (
    <>
      <div className="entry-actions" aria-label={`${name} actions`}>
        <div className="entry-tools">
          {onEdit ? (
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
          ) : null}
          <button
            className="btn quiet entry-icon"
            type="button"
            ref={icon}
            data-entry-action="delete"
            aria-label={what === 'memo' ? 'Delete voice memo' : 'Delete entry'}
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
            aria-label={`${name} memory settings: in memory`}
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
      {memory.said ? (
        <NotBuiltYet className="auth-help state-message" />
      ) : null}
    </>
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
  const enterToSave = enterToSaveHandler(onSave);

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

/*
 * The play button of a saved voice memo, and the player behind it.
 *
 * The audio is asked for when play is first pressed, with the access token,
 * and given to <audio> as a local address (lib/playback.ts, ADR-023). The
 * address is let go when the row leaves the screen. Pressing the button
 * while the memo plays pauses it.
 *
 * The playback is made at the first press and not when the row is drawn, so
 * that React drawing the row twice in development cannot release it before
 * it is used.
 */
function useMemoPlayer(entryId: string) {
  const audio = useRef<HTMLAudioElement>(null);
  const playback = useRef<Playback | null>(null);
  const [state, setState] = useState<PlaybackState>({ status: 'idle' });
  const [playing, setPlaying] = useState(false);

  useEffect(
    () => () => {
      playback.current?.release();
      playback.current = null;
    },
    [],
  );

  async function press() {
    const element = audio.current;

    if (!element) {
      return;
    }

    if (!element.paused) {
      element.pause();
      return;
    }

    if (!playback.current) {
      const made = createPlayback({
        request: session.request,
        entryId,
        urls: {
          create: (blob) => URL.createObjectURL(blob),
          revoke: (url) => URL.revokeObjectURL(url),
        },
      });

      made.subscribe(() => setState(made.getState()));
      playback.current = made;
    }

    const url = await playback.current.load();

    if (!url) {
      return;
    }

    if (element.src !== url) {
      element.src = url;
    }

    void element.play().catch(() => setPlaying(false));
  }

  const element = (
    <audio
      ref={audio}
      hidden
      preload="none"
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
    />
  );

  return { press, playing, element, state };
}

/* Mine: she has not chosen words for a memo that does not play. */
const NOT_PLAYED: Record<NotPlayed, string> = {
  unreachable: 'We could not reach the server. The recording did not play.',
  refused: 'Something went wrong on our side. The recording did not play.',
};

function PlayIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {playing ? (
        <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
      ) : (
        <path d="M8 5.5v13l11-6.5z" />
      )}
    </svg>
  );
}

/*
 * The head of a memo's row, as #recording-kept draws it: its time, its play
 * button, the waveform, which is a static picture (features.md, Ref 22), and
 * its length. A memo that is still being sent has none of the first two or
 * the last, because they are the API's to give.
 */
function MemoHead({
  saved,
  player,
}: {
  saved?: { time: string; datetime: string; durationMs: number };
  player?: ReturnType<typeof useMemoPlayer>;
}) {
  return (
    <div className="head dated">
      <div className="tcol">
        {saved ? <time dateTime={saved.datetime}>{saved.time}</time> : null}
      </div>
      <div className="ccol">
        {saved && player ? (
          <button
            className="play"
            type="button"
            aria-label={
              player.playing
                ? 'Pause this recording'
                : `Play this recording, ${speakDuration(saved.durationMs)}`
            }
            onClick={() => void player.press()}
          >
            <PlayIcon playing={player.playing} />
          </button>
        ) : null}
        <LiveWaveform />
        {saved ? (
          <span className="dur">{formatDuration(saved.durationMs)}</span>
        ) : null}
        {player?.element}
      </div>
    </div>
  );
}

function NotPlayedLine({ player }: { player: ReturnType<typeof useMemoPlayer> }) {
  return player.state.status === 'failed' ? (
    <p className="auth-help state-message" role="alert">
      {NOT_PLAYED[player.state.why]}
    </p>
  ) : null;
}

/*
 * A saved voice memo on a day's page. It is deleted as an entry is, and has
 * no edit icon. A memo has no words until it has a transcript (feature 11),
 * and none are shown until then.
 */
export function LiveMemo({
  id,
  time,
  datetime,
  durationMs,
  content,
  confirming,
  notDeleted,
  onAsk,
  onKeep,
  onGoAhead,
}: {
  id: string;
  time: string;
  datetime: string;
  durationMs: number;
  content: string | null;
  confirming: boolean;
  notDeleted?: string;
  onAsk: () => void;
  onKeep: () => void;
  onGoAhead: () => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const player = useMemoPlayer(id);

  return (
    <div className="recrow" ref={row} data-entry-id={id}>
      <MemoHead saved={{ time, datetime, durationMs }} player={player} />
      <div className="body">
        <div className="tcol" />
        <div className="ccol">
          {content !== null ? <p className="prose">{content}</p> : null}
          <EntryTools
            row={row}
            what="memo"
            confirming={confirming}
            notDeleted={notDeleted}
            onAsk={onAsk}
            onKeep={onKeep}
            onGoAhead={onGoAhead}
          />
          <NotPlayedLine player={player} />
        </div>
      </div>
    </div>
  );
}

/* Her words, 2026-10-16. */
const SAVING_RECORDING = 'Saving your recording.';
const RECORDING_NOT_SAVED =
  'Your recording was not saved. It is still on this page; try again. If you close this page, it is lost.';

/*
 * A memo that has been kept and is not yet on the day, at the bottom of
 * Today (lib/uploads.ts). While it is being sent it has no time; if it was
 * not saved it says so and offers Try again. Once the API has answered, it
 * has its time, its length and its play button, and is replaced by the
 * day's own row as soon as the day has been asked for again.
 */
export function PendingMemo({
  upload,
  onRetry,
}: {
  upload: Upload;
  onRetry: () => void;
}) {
  if (upload.status === 'saved') {
    return <ArrivedMemo entry={upload.entry} />;
  }

  return (
    <div className="recrow" data-upload-id={upload.id}>
      <MemoHead />
      <div className="body">
        <div className="tcol" />
        <div className="ccol">
          <div className="state-message">
            {upload.status === 'saving' ? (
              <p className="auth-help state-message" role="status">
                {SAVING_RECORDING}
              </p>
            ) : (
              <>
                <p className="auth-help state-message" role="alert">
                  {RECORDING_NOT_SAVED}
                </p>
                <button className="btn solid" type="button" onClick={onRetry}>
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrivedMemo({ entry }: { entry: Entry }) {
  const player = useMemoPlayer(entry.id);

  return (
    <div className="recrow" data-upload-entry-id={entry.id}>
      <MemoHead
        saved={{
          time: formatTime(entry.createdAt),
          datetime: entry.createdAt,
          durationMs: entry.durationMs ?? 0,
        }}
        player={player}
      />
      <div className="body">
        <div className="tcol" />
        <div className="ccol">
          <NotPlayedLine player={player} />
        </div>
      </div>
    </div>
  );
}
