'use client';

import { MAX_PAGE_SIZE } from '@neuron/contracts';
import Link from 'next/link';
import { Fragment, useEffect, useState, useSyncExternalStore } from 'react';
import { Gate } from '@/app/components/Gate';
import { KeyBox, LiveScreen } from '@/app/components/LiveScreen';
import { session } from '@/lib/api';
import {
  formatDay,
  formatDayOfMonth,
  formatLongDay,
  formatMonth,
} from '@/lib/format';
import { createTimeline, type TimelineDay } from '@/lib/timeline';

/*
 * The list from 02-timeline.html: months, newest first; under each month its
 * days, newest first; under each day its entries.
 *
 * Not drawn, because none of them is built: the calendar, the control that
 * switches between list and calendar, the total, the "Since" line, the
 * source mark, and anything about recordings or memory.
 */
export function LiveTimeline() {
  return <Gate>{() => <OpenTimeline />}</Gate>;
}

/* "1 entry" and "3 entries", for the name a screen reader says. */
function countOf(entries: number): string {
  return entries === 1 ? '1 entry' : `${entries} entries`;
}

/*
 * One day. The date is the link to the day's page, and is the only link in
 * the day, however many entries it has. Its name for a screen reader is the
 * date in full and the number of entries, where the eye reads "Sun 9".
 *
 * Today's row leads to Today's own address, which is where the page of
 * today's date would send the person anyway.
 *
 * The date column of every entry after the first is there and empty: the
 * date belongs to the day, and these are not new days (02-timeline.html).
 */
function DayRows({ day, today }: { day: TimelineDay; today: string }) {
  return day.entries.map((entry, index) => (
    <div
      className="dayrow"
      key={entry.id}
      id={index === 0 ? `d-${day.date}` : undefined}
    >
      <div className="tcol">
        {index === 0 ? (
          <Link
            href={day.date === today ? '/' : `/d/${day.date}`}
            aria-label={`${formatLongDay(day.date)}, ${countOf(day.entries.length)}`}
          >
            <time dateTime={day.date}>{formatDayOfMonth(day.date)}</time>
          </Link>
        ) : null}
      </div>
      <div className="ccol">
        <p className="lede">{entry.content}</p>
      </div>
    </div>
  ));
}

function OpenTimeline() {
  const [timeline] = useState(() =>
    createTimeline({ request: session.request, pageSize: MAX_PAGE_SIZE }),
  );
  const { view, asking } = useSyncExternalStore(
    timeline.subscribe,
    timeline.getState,
    timeline.getState,
  );

  useEffect(() => {
    void timeline.open();
  }, [timeline]);

  /*
   * The date box is empty until the API has said which day today is, as on
   * Today. It is never filled from the browser's clock.
   */
  const today =
    view.status === 'open' || view.status === 'empty' ? view.today : '';

  return (
    <LiveScreen
      current="Timeline"
      title="Timeline"
      split
      aside={<KeyBox label="Day" value={today ? formatDay(today) : ''} />}
    >
      {view.status === 'opening' ? (
        <main className="sheet">
          <div className="state-message">
            <p className="auth-help state-message" role="status">
              Loading your days.
            </p>
          </div>
        </main>
      ) : null}

      {view.status === 'unreachable' || view.status === 'failed' ? (
        <main className="sheet">
          <div className="state-message">
            <div className="notice" role="alert">
              {view.status === 'unreachable'
                ? 'We could not reach the server. Try loading it again.'
                : 'Something went wrong on our side. Try loading it again.'}
              {view.asked > 1 ? ` Asked ${view.asked} times.` : null}
            </div>
            {asking ? (
              <p className="auth-help" role="status">
                Asking again.
              </p>
            ) : null}
            <div className="auth-actions">
              <button
                className="btn solid"
                type="button"
                onClick={() => void timeline.open()}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      ) : null}

      {view.status === 'empty' ? (
        <p className="empty">
          Nothing is written yet. Your days will be listed here.
        </p>
      ) : null}

      {view.status === 'open' ? (
        <>
          <main className="sheet">
            {/* The heading and the rows are the sheet's own children, with
                nothing wrapped around them: lock.css rules each child of a
                sheet off from the one before it. */}
            {view.months.map((month) => (
              <Fragment key={month.month}>
                <h2 className="shead">{formatMonth(month.month)}</h2>
                {month.days.map((day) => (
                  <DayRows key={day.date} day={day} today={view.today} />
                ))}
              </Fragment>
            ))}
          </main>
          <p className="foot">
            {view.complete
              ? 'There is nothing earlier in this journal.'
              : 'This list stops here. Your earlier days are still in your journal, and are not listed yet.'}
          </p>
        </>
      ) : null}
    </LiveScreen>
  );
}
