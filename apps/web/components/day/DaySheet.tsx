'use client';

import { EntryKind, type Mood, type Entry } from '@neuron/contracts';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  LiveEntry,
  LiveMemo,
  MoodRow,
  type EntryEditor,
  type MemoryControls,
} from '@/components/day/Journal';
import { memoryMenuOf, inMemoryQuestion } from '@/lib/memory';
import { formatTime } from '@/lib/utils/format';
import {
  rowMemoryOf,
  type DayPage,
  type DayState,
  type EditNotSaved,
  type Editing,
  type MoodNotSaved,
  type NotDeleted,
} from '@/lib/today';

const NOT_DELETED: Record<NotDeleted, string> = {
  unreachable: 'We could not reach the server. The entry is still here.',
  refused: 'Something went wrong on our side. The entry is still here.',
};

/* The owner's words. */
const MOOD_NOT_SAVED: Record<MoodNotSaved, string> = {
  unreachable: 'Your mood was not saved. We could not reach the server.',
  refused: 'Your mood was not saved. Something went wrong on our side.',
};

/* In the composer's style (LiveToday.tsx). Her words, 2026-10-15. */
const EDIT_NOT_SAVED: Record<EditNotSaved, string> = {
  unreachable:
    'We could not reach the server. Your change was not saved. Your words are still here; try saving again.',
  refused:
    'Something went wrong on our side. Your change was not saved. Your words are still here; try saving again.',
  blank: 'An entry needs some words. Your change was not saved.',
};

const EDITED_GONE =
  'That entry had been deleted somewhere else, so your change was not saved.';

/* "Saving…" is her word for the edit in flight, as the composer says it. */
function editorOf(editing: Editing): EntryEditor {
  const { save } = editing;

  return {
    text: editing.text,
    saving: save.status === 'saving',
    line: save.status === 'saving' ? 'Saving…' : undefined,
    problem: save.status === 'notSaved' ? EDIT_NOT_SAVED[save.why] : undefined,
    blank: save.status === 'notSaved' && save.why === 'blank',
  };
}

/*
 * A deleted entry leaves the page at once, and its buttons leave with it.
 * Focus would be left on nothing, and the next press of Tab would start
 * again from the top of the page. So before the entry goes, the place focus
 * should go to is written down here, and it is moved once the page has been
 * drawn without the entry: to the delete control of the entry after it, or
 * of the one before it, or to whatever the screen shows for a day with
 * nothing on it, which the screen marks with `whenEmpty`.
 *
 * `drawn` is anything that changes each time the day is drawn again.
 */
export function useFocusAfterDelete<T extends HTMLElement>(
  entries: readonly Entry[],
  drawn: unknown,
) {
  const whenEmpty = useRef<T>(null);
  const focusNext = useRef<{ entry: string | null } | null>(null);

  useEffect(() => {
    const next = focusNext.current;

    if (!next) {
      return;
    }

    focusNext.current = null;

    const control = next.entry
      ? document.querySelector<HTMLElement>(
          `[data-entry-id="${next.entry}"] [data-entry-action="delete"]`,
        )
      : null;

    (control ?? whenEmpty.current)?.focus();
  }, [drawn]);

  /* Called just before the entry is deleted. */
  function leaving(id: string) {
    const at = entries.findIndex((entry) => entry.id === id);
    const neighbour = entries[at + 1] ?? entries[at - 1];

    focusNext.current = { entry: neighbour?.id ?? null };
  }

  return { whenEmpty, leaving };
}

/*
 * The entries of one day and its mood row. Today and the page of any other
 * date both draw this, and differ only in the words beside the mood, and in
 * `after`: Today's voice memos that are not on the day yet, at the bottom.
 *
 * A voice memo is deleted as an entry is, and is never edited.
 */
export function DaySheet({
  page,
  view,
  entries,
  mood,
  moodLabel,
  onLeaving,
  after,
}: {
  page: DayPage;
  view: DayState;
  entries: readonly Entry[];
  mood: Mood | null;
  moodLabel: string;
  onLeaving: (id: string) => void;
  after?: ReactNode;
}) {
  const gone = useRef<HTMLParagraphElement>(null);

  /*
   * An edit answered 404 takes its row, and the focus in it, away. Focus
   * goes to the sentence that says why, if it was left on nothing.
   */
  useEffect(() => {
    if (view.editedGone && document.activeElement === document.body) {
      gone.current?.focus({ preventScroll: true });
    }
  }, [view.editedGone]);

  /* The memory menu of one row, from lib/memory.ts and lib/today.ts. */
  const memoryOf = (entry: Entry): MemoryControls => ({
    menu: memoryMenuOf(entry, rowMemoryOf(view.memory, entry.id)),
    question:
      view.memory.confirming === entry.id
        ? inMemoryQuestion(entry)
        : undefined,
    onAsk: () => page.askToUseInMemory(entry.id),
    onKeepOut: page.keepOutOfMemory,
    onUseInMemory: () => void page.useInMemory(),
  });

  return (
    <main className="sheet">
      {entries.map((entry) => {
        const why = view.notDeleted[entry.id];

        if (entry.kind === EntryKind.Voice) {
          return (
            <LiveMemo
              key={entry.id}
              id={entry.id}
              time={formatTime(entry.createdAt)}
              datetime={entry.createdAt}
              durationMs={entry.durationMs ?? 0}
              content={entry.content}
              confirming={view.confirming === entry.id}
              notDeleted={why ? NOT_DELETED[why] : undefined}
              onAsk={() => page.askToDelete(entry.id)}
              onKeep={() =>
                view.confirming === entry.id
                  ? page.keep()
                  : page.dismiss(entry.id)
              }
              onGoAhead={() => {
                onLeaving(entry.id);
                void page.goAhead();
              }}
              memory={memoryOf(entry)}
            />
          );
        }

        return (
          <LiveEntry
            key={entry.id}
            id={entry.id}
            time={formatTime(entry.createdAt)}
            datetime={entry.createdAt}
            confirming={view.confirming === entry.id}
            notDeleted={why ? NOT_DELETED[why] : undefined}
            onAsk={() => page.askToDelete(entry.id)}
            onKeep={() =>
              view.confirming === entry.id
                ? page.keep()
                : page.dismiss(entry.id)
            }
            onGoAhead={() => {
              onLeaving(entry.id);
              void page.goAhead();
            }}
            memory={memoryOf(entry)}
            editor={
              view.editing?.id === entry.id ? editorOf(view.editing) : undefined
            }
            onEdit={() => page.edit(entry.id)}
            onEditType={page.typeEdit}
            onEditSave={() => void page.saveEdit()}
            onEditCancel={page.cancelEdit}
          >
            {entry.content}
          </LiveEntry>
        );
      })}

      {after}

      {view.editedGone ? (
        <p
          className="auth-help state-message"
          role="alert"
          tabIndex={-1}
          ref={gone}
        >
          {EDITED_GONE}
        </p>
      ) : null}

      <MoodRow
        label={moodLabel}
        chosen={mood}
        problem={
          view.moodNotSaved ? MOOD_NOT_SAVED[view.moodNotSaved] : undefined
        }
        onPress={(pressed) => void page.pressMood(pressed)}
      />
    </main>
  );
}
