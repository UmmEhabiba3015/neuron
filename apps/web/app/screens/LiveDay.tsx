'use client';

import { MAX_PAGE_SIZE } from '@neuron/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { BlankScreen } from '@/app/components/AuthScreen';
import { Gate } from '@/app/components/Gate';
import { KeyBox, PushedScreen } from '@/app/components/LiveScreen';
import { session } from '@/lib/api';
import { formatDay, isCalendarDate } from '@/lib/format';
import { createPastDay } from '@/lib/today';
import { DaySheet, useFocusAfterDelete } from './DaySheet';
import { NothingOnThisDay, PageNotFound } from './Missing';

/*
 * The page of one day that is not today: its entries and its mood, and no
 * composer. The server files an entry on the day it is written, so nothing
 * here suggests that writing is possible.
 *
 * `date` is the text in the address, exactly as it was typed. Whether it is
 * a date at all is decided in lib/today.ts.
 */
export function LiveDay({ date }: { date: string }) {
  return <Gate>{() => <OpenDay date={date} />}</Gate>;
}

function OpenDay({ date }: { date: string }) {
  const router = useRouter();

  /* One for each time this page is opened, as on Today. */
  const [page] = useState(() =>
    createPastDay({
      request: session.request,
      pageSize: MAX_PAGE_SIZE,
      date,
    }),
  );
  const view = useSyncExternalStore(
    page.subscribe,
    page.getState,
    page.getState,
  );

  useEffect(() => {
    void page.open();

    /* Another tab may have changed this day while this one was not looked at. */
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void page.look();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [page]);

  const { day } = view;
  const isToday = day.status === 'isToday';

  /*
   * The date in the address is today's. Today has its own address, with a
   * composer, and this address has none, so the person is sent there. The
   * address is replaced, so that Back does not return here and bounce.
   */
  useEffect(() => {
    if (isToday) {
      router.replace('/');
    }
  }, [isToday, router]);

  const { whenEmpty, leaving } = useFocusAfterDelete<HTMLHeadingElement>(
    day.status === 'open' ? day.entries : [],
    day,
  );

  if (isToday) {
    return <BlankScreen />;
  }

  if (day.status === 'notFound') {
    return <PageNotFound />;
  }

  if (day.status === 'emptied') {
    return <NothingOnThisDay heading={whenEmpty} />;
  }

  /*
   * The date box holds the date from the address from the first moment, so
   * the header does not change when the day arrives. It is the same text the
   * API will answer with, and is never today's date worked out here.
   */
  const shown = day.status === 'open' ? day.date : date;

  return (
    <PushedScreen
      back={{ href: '/timeline', label: 'Timeline' }}
      aside={
        <KeyBox
          label="Day"
          value={isCalendarDate(shown) ? formatDay(shown) : ''}
          heading
        />
      }
    >
      {day.status === 'opening' ? (
        <main className="sheet">
          <div className="state-message">
            <p className="auth-help state-message" role="status">
              Loading this day.
            </p>
          </div>
        </main>
      ) : null}

      {day.status === 'unreachable' || day.status === 'failed' ? (
        <main className="sheet">
          <div className="state-message">
            <div className="notice" role="alert">
              {day.status === 'unreachable'
                ? 'We could not reach the server. Try loading this day again.'
                : 'Something went wrong on our side. Try loading this day again.'}
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
                onClick={() => void page.open()}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      ) : null}

      {day.status === 'open' ? (
        <>
          <DaySheet
            page={page}
            view={view}
            entries={day.entries}
            mood={day.mood}
            moodLabel="Day felt"
            onLeaving={leaving}
          />
          <p className="foot">Mood can be changed here, and only here.</p>
        </>
      ) : null}
    </PushedScreen>
  );
}
