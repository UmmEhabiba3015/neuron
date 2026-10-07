'use client';

import { MAX_PAGE_SIZE } from '@neuron/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BlankScreen } from '@/app/components/AuthScreen';
import { KeyBox, LiveScreen } from '@/app/components/LiveScreen';
import { LiveComposer, LiveEntry, MoodRow } from '@/app/components/Journal';
import { useSession } from '@/app/components/useSession';
import { session } from '@/lib/api';
import { formatDay, formatTime } from '@/lib/format';
import {
  createToday,
  isBlank,
  type MoodNotSaved,
  type NotDeleted,
  type TodayState,
} from '@/lib/today';
import { CouldNotConnect } from './CouldNotConnect';

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
 * An ended session has no sentence here: the screen leaves for /in, and that
 * screen says it.
 */
function composerProblem(save: TodayState['save']): string | undefined {
  if (save.status !== 'notSaved') {
    return undefined;
  }

  if (save.why === 'unreachable') {
    return 'We could not reach the server. Your entry was not saved. Your words are still here; try saving again.';
  }

  if (save.why === 'blank') {
    return 'An entry needs some words. Your entry was not saved.';
  }

  if (save.why === 'refused') {
    return 'Something went wrong on our side. Your entry was not saved. Your words are still here; try saving again.';
  }

  return undefined;
}

function composerLine(save: TodayState['save']): string | undefined {
  if (save.status === 'saving') {
    return 'Saving.';
  }

  if (save.status === 'saved') {
    return 'Saved. Opening today again.';
  }

  return undefined;
}

export function LiveToday() {
  const state = useSession();
  const router = useRouter();

  /*
   * One for each time this screen is opened, and not one for the page as the
   * session is: what one person typed must not be there for the next person
   * who signs in.
   */
  const [today] = useState(() =>
    createToday({ request: session.request, pageSize: MAX_PAGE_SIZE }),
  );
  const view = useSyncExternalStore(
    today.subscribe,
    today.getState,
    today.getState,
  );

  const signedIn = state.status === 'signedIn';
  const signedOut = state.status === 'signedOut';

  useEffect(() => {
    if (signedOut) {
      router.replace('/in');
    }
  }, [signedOut, router]);

  useEffect(() => {
    if (!signedIn) {
      return;
    }

    void today.open();

    /*
     * A tab left open across midnight still holds yesterday's date, so the
     * question is asked again whenever the tab is looked at again.
     */
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void today.look();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [signedIn, today]);

  /*
   * A deleted entry leaves the page at once, and its buttons leave with it.
   * Focus would be left on nothing, and the next press of Tab would start
   * again from the top of the page. So before the entry goes, the place focus
   * should go to is written down here, and it is moved once the page has been
   * drawn without the entry: to the delete control of the entry after it, or
   * of the one before it, or to the line that says the day is empty.
   */
  const emptyLine = useRef<HTMLParagraphElement>(null);
  const focusNext = useRef<{ entry: string | null } | null>(null);
  const shownEntries = view.day.status === 'open' ? view.day.entries : null;

  useEffect(() => {
    const next = focusNext.current;

    if (!next || !shownEntries) {
      return;
    }

    focusNext.current = null;

    const control = next.entry
      ? document.querySelector<HTMLElement>(
          `[data-entry-id="${next.entry}"] [data-entry-action="delete"]`,
        )
      : null;

    (control ?? emptyLine.current)?.focus();
  }, [shownEntries]);

  function goAhead(id: string) {
    const entries = shownEntries ?? [];
    const at = entries.findIndex((entry) => entry.id === id);
    const neighbour = entries[at + 1] ?? entries[at - 1];

    focusNext.current = { entry: neighbour?.id ?? null };
    void today.goAhead();
  }

  if (state.status === 'unreachable') {
    return <CouldNotConnect asking={state.asking} asked={state.asked} />;
  }

  if (!signedIn) {
    return <BlankScreen />;
  }

  const { day, save } = view;

  /*
   * The date box is always drawn, and is empty until the API has said which
   * day it is, so that the masthead keeps its height and nothing below it
   * moves when the date arrives.
   */
  const date = day.status === 'open' ? formatDay(day.date) : '';

  return (
    <LiveScreen current="Today" aside={<KeyBox label="Day" value={date} />}>
      {day.status === 'opening' ? (
        <main className="sheet">
          <div className="state-message">
            <p className="auth-help state-message" role="status">
              Opening your journal.
            </p>
          </div>
        </main>
      ) : null}

      {day.status === 'unreachable' || day.status === 'failed' ? (
        <main className="sheet">
          <div className="state-message">
            <div className="notice" role="alert">
              {save.status === 'saved' ? 'Your entry was saved. ' : null}
              {day.status === 'unreachable'
                ? 'We could not reach the server. Try loading it again.'
                : 'Something went wrong on our side. Try loading it again.'}
              {day.asked > 1 ? ` Asked ${day.asked} times.` : null}
            </div>
            {view.asking ? (
              <p className="auth-help" role="status">
                Asking again.
              </p>
            ) : null}
            <div className="auth-actions">
              <button
                className="btn solid"
                type="button"
                onClick={() => void today.open()}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      ) : null}

      {/* It can take focus, and is not a stop for the Tab key: it is where
          focus goes when the last entry of the day has been deleted. */}
      {day.status === 'open' && day.entries.length === 0 ? (
        <p className="empty" tabIndex={-1} ref={emptyLine}>
          What&apos;s today been like?
        </p>
      ) : null}

      {day.status === 'open' && day.entries.length > 0 ? (
        <main className="sheet">
          {day.entries.map((entry) => {
            const why = view.notDeleted[entry.id];

            return (
              <LiveEntry
                key={entry.id}
                id={entry.id}
                time={formatTime(entry.createdAt)}
                datetime={entry.createdAt}
                confirming={view.confirming === entry.id}
                notDeleted={why ? NOT_DELETED[why] : undefined}
                onAsk={() => today.askToDelete(entry.id)}
                onKeep={() =>
                  view.confirming === entry.id
                    ? today.keep()
                    : today.dismiss(entry.id)
                }
                onGoAhead={() => goAhead(entry.id)}
              >
                {entry.content}
              </LiveEntry>
            );
          })}

          <MoodRow
            chosen={day.mood}
            problem={
              view.moodNotSaved ? MOOD_NOT_SAVED[view.moodNotSaved] : undefined
            }
            onPress={(mood) => void today.pressMood(mood)}
          />
        </main>
      ) : null}

      {day.status === 'open' ? (
        <LiveComposer
          text={view.text}
          holdsWords={!isBlank(view.text)}
          line={composerLine(save)}
          problem={composerProblem(save)}
          onType={today.type}
          onSave={() => void today.save()}
        />
      ) : null}
    </LiveScreen>
  );
}
