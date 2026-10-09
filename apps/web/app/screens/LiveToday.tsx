'use client';

import { MAX_PAGE_SIZE } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { BlankScreen } from '@/app/components/AuthScreen';
import {
  JournalBox,
  KeyBox,
  LiveScreen,
} from '@/app/components/LiveScreen';
import { LiveComposer } from '@/app/components/Journal';
import { useSession } from '@/app/components/useSession';
import { session } from '@/lib/api';
import { formatDay } from '@/lib/format';
import { createToday, isBlank, type TodayState } from '@/lib/today';
import { CouldNotConnect } from './CouldNotConnect';
import { DaySheet, useFocusAfterDelete } from './DaySheet';

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

/*
 * The composer's options, from #composer-options in
 * 18-entry-system-states.html: today's page, with a panel in the composer's
 * place. lock.css says a panel pushes a history entry and Back closes it,
 * so the panel has its own address, /options, and Back returns to Today.
 * As the comp draws it, the page is a plain sheet and its date box is the
 * journal's.
 *
 * Its one row leads to the support resource. Words typed in the composer
 * and not saved are not carried here: keeping a draft is Day 18's.
 */
function ComposerOptions() {
  return (
    <section className="panel" aria-label="Composer options">
      <h2>Composer options</h2>
      <Link className="srowlink" href="/support">
        <span className="lab">
          If you want to talk to someone
          <span className="why">
            A support resource is available whenever you need it.
          </span>
        </span>
        <span className="val">Read</span>
      </Link>
      <div className="auth-actions">
        <Link className="btn quiet" href="/">
          Back to Today
        </Link>
      </div>
    </section>
  );
}

export function LiveToday({ options }: { options?: boolean }) {
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

  /* Where focus goes when an entry is deleted: see DaySheet.tsx. */
  const shownEntries = view.day.status === 'open' ? view.day.entries : [];
  const { whenEmpty, leaving } = useFocusAfterDelete<HTMLParagraphElement>(
    shownEntries,
    view.day,
  );

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
    <LiveScreen
      current="Today"
      surface={options}
      aside={options ? <JournalBox /> : <KeyBox label="Day" value={date} />}
    >
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
        <p className="empty" tabIndex={-1} ref={whenEmpty}>
          What&apos;s today been like?
        </p>
      ) : null}

      {day.status === 'open' && day.entries.length > 0 ? (
        <DaySheet
          page={today}
          view={view}
          entries={day.entries}
          mood={day.mood}
          moodLabel="Today felt"
          onLeaving={leaving}
        />
      ) : null}

      {options ? <ComposerOptions /> : null}

      {day.status === 'open' && !options ? (
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
