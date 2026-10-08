'use client';

import type { Mood, WireEntry } from '@neuron/contracts';
import { useEffect, useRef } from 'react';
import { LiveEntry, MoodRow } from '@/app/components/Journal';
import { formatTime } from '@/lib/format';
import type {
  DayPage,
  DayState,
  MoodNotSaved,
  NotDeleted,
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
  entries: readonly WireEntry[],
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
 * date both draw this, and differ only in the words beside the mood.
 */
export function DaySheet({
  page,
  view,
  entries,
  mood,
  moodLabel,
  onLeaving,
}: {
  page: DayPage;
  view: DayState;
  entries: readonly WireEntry[];
  mood: Mood | null;
  moodLabel: string;
  onLeaving: (id: string) => void;
}) {
  return (
    <main className="sheet">
      {entries.map((entry) => {
        const why = view.notDeleted[entry.id];

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
          >
            {entry.content}
          </LiveEntry>
        );
      })}

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
