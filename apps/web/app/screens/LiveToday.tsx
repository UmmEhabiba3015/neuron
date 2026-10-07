'use client';

import { MAX_PAGE_SIZE } from '@neuron/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { BlankScreen } from '@/app/components/AuthScreen';
import { KeyBox, LiveScreen } from '@/app/components/LiveScreen';
import { LiveComposer, LiveEntry, MoodRow } from '@/app/components/Journal';
import { useSession } from '@/app/components/useSession';
import { session } from '@/lib/api';
import { formatDay, formatTime } from '@/lib/format';
import {
  createToday,
  isBlank,
  type NotDeleted,
  type TodayState,
} from '@/lib/today';
import { CouldNotConnect } from './CouldNotConnect';

const NOT_DELETED: Record<NotDeleted, string> = {
  unreachable: 'We could not reach the server. The entry is still here.',
  refused: 'Something went wrong on our side. The entry is still here.',
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
     * A tab left open across 4am still holds yesterday's date, so the
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
        <p className="empty" role="status">
          Opening today.
        </p>
      ) : null}

      {day.status === 'unreachable' || day.status === 'failed' ? (
        <div className="notice" role="alert">
          <p>
            {save.status === 'saved' ? 'Your entry was saved. ' : null}
            {day.status === 'unreachable'
              ? 'Could not connect. We could not open today.'
              : 'Something went wrong on our side. We could not open today.'}
            {day.asked > 1 ? ` Asked ${day.asked} times.` : null}
          </p>
          {view.asking ? <p role="status">Asking again.</p> : null}
          <button
            className="btn quiet"
            type="button"
            onClick={() => void today.open()}
          >
            Try again
          </button>
        </div>
      ) : null}

      {day.status === 'open' && day.entries.length === 0 ? (
        <p className="empty">What&apos;s today been like?</p>
      ) : null}

      {day.status === 'open' && day.entries.length > 0 ? (
        <main className="sheet">
          {day.entries.map((entry) => {
            const why = view.notDeleted[entry.id];

            return (
              <LiveEntry
                key={entry.id}
                time={formatTime(entry.createdAt)}
                datetime={entry.createdAt}
                confirming={view.confirming === entry.id}
                notDeleted={why ? NOT_DELETED[why] : undefined}
                onAsk={() => today.askToDelete(entry.id)}
                onKeep={today.keep}
                onGoAhead={() => void today.goAhead()}
              >
                {entry.content}
              </LiveEntry>
            );
          })}

          <MoodRow />
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
