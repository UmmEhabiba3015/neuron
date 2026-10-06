'use client';

import { MAX_PAGE_SIZE, type WireDay, type WireEntry } from '@neuron/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BlankScreen } from '@/app/components/AuthScreen';
import { KeyBox, LiveScreen } from '@/app/components/LiveScreen';
import { Composer, Entry, MoodRow } from '@/app/components/Journal';
import { useSession } from '@/app/components/useSession';
import { session } from '@/lib/api';
import { formatDay, formatTime } from '@/lib/format';
import { CouldNotConnect } from './CouldNotConnect';

/*
 * `ended` is not a failure of this screen. The session module has already
 * recorded that the person is signed out, and the screen leaves for /in.
 */
type Fetched =
  | { status: 'loaded'; day: WireDay; entries: WireEntry[] }
  | { status: 'unreachable' }
  | { status: 'failed' }
  | { status: 'ended' };

type Load = { status: 'loading' } | Exclude<Fetched, { status: 'ended' }>;

/*
 * The date is the API's: the browser never works out which day "today" is
 * (ADR-015).
 */
async function fetchToday(): Promise<Fetched> {
  const day = await session.request<WireDay>('/days/today');

  if (day.kind !== 'ok') {
    return { status: statusOf(day.kind) };
  }

  const entries: WireEntry[] = [];

  for (;;) {
    const page = await session.request<WireEntry[]>(
      `/entries?date=${day.data.date}&limit=${MAX_PAGE_SIZE}&offset=${entries.length}`,
    );

    if (page.kind !== 'ok') {
      return { status: statusOf(page.kind) };
    }

    entries.push(...page.data);

    if (page.data.length < MAX_PAGE_SIZE) {
      break;
    }
  }

  /* The API lists newest first, and a day reads oldest first. */
  entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return { status: 'loaded', day: day.data, entries };
}

function statusOf(
  kind: 'rejected' | 'ended' | 'unreachable',
): 'failed' | 'ended' | 'unreachable' {
  return kind === 'rejected' ? 'failed' : kind;
}

export function LiveToday() {
  const state = useSession();
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  const signedIn = state.status === 'signedIn';
  const signedOut = state.status === 'signedOut';

  useEffect(() => {
    if (signedOut) {
      router.replace('/in');
    }
  }, [signedOut, router]);

  /* Counts presses of "Try again", so that a press asks the API again. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!signedIn) {
      return;
    }

    let current = true;

    /*
     * `keep` is for asking again while something is already on the screen:
     * what is there stays unless the new answer is a good one.
     */
    const open = (keep: boolean) =>
      fetchToday().then((fetched) => {
        if (!current || fetched.status === 'ended') {
          return;
        }

        if (!keep || fetched.status === 'loaded') {
          setLoad(fetched);
        }
      });

    void open(false);

    /*
     * A tab left open across 4am still holds yesterday's date, so the
     * question is asked again whenever the tab is looked at again.
     */
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void open(true);
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      current = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [signedIn, attempt]);

  if (state.status === 'unreachable') {
    return <CouldNotConnect />;
  }

  if (!signedIn) {
    return <BlankScreen />;
  }

  const tryAgain = () => {
    setLoad({ status: 'loading' });
    setAttempt((count) => count + 1);
  };

  /*
   * The date box is always drawn, and is empty until the API has said which
   * day it is, so that the masthead keeps its height and nothing below it
   * moves when the date arrives.
   */
  const date = load.status === 'loaded' ? formatDay(load.day.date) : '';

  return (
    <LiveScreen current="Today" aside={<KeyBox label="Day" value={date} />}>
      {load.status === 'loading' ? (
        <p className="empty" role="status">
          Opening today.
        </p>
      ) : null}

      {load.status === 'unreachable' || load.status === 'failed' ? (
        <div className="notice" role="alert">
          <p>
            {load.status === 'unreachable'
              ? 'Could not connect. We could not open today.'
              : 'Something went wrong on our side. We could not open today.'}
          </p>
          <button className="btn quiet" type="button" onClick={tryAgain}>
            Try again
          </button>
        </div>
      ) : null}

      {load.status === 'loaded' && load.entries.length === 0 ? (
        <p className="empty">What&apos;s today been like?</p>
      ) : null}

      {load.status === 'loaded' && load.entries.length > 0 ? (
        <main className="sheet">
          {load.entries.map((entry) => (
            <Entry
              key={entry.id}
              time={formatTime(entry.createdAt)}
              datetime={entry.createdAt}
            >
              {entry.content}
            </Entry>
          ))}

          <MoodRow />
        </main>
      ) : null}

      {load.status === 'loaded' ? <Composer /> : null}
    </LiveScreen>
  );
}
