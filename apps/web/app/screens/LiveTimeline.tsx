'use client';

import { MAX_PAGE_SIZE } from '@neuron/contracts';
import Link from 'next/link';
import {
  Fragment,
  useEffect,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from 'react';
import { Gate } from '@/app/components/Gate';
import { KeyBox, LiveScreen } from '@/app/components/LiveScreen';
import { session } from '@/lib/api';
import { weeksOf, writtenDayLabel } from '@/lib/calendar';
import {
  formatDay,
  formatDayOfMonth,
  formatLongDay,
  formatMonth,
} from '@/lib/format';
import {
  createTimeline,
  type TimelineCalendar,
  type TimelineDay,
} from '@/lib/timeline';

/*
 * 02-timeline.html: the list, and the calendar of today's month.
 *
 * The list: months, newest first; under each month its days, newest first;
 * under each day its entries.
 *
 * On desktop both are drawn, side by side: the list is the record and the
 * calendar is an index into it. Below desktop there is room for one, and
 * the switch in the masthead chooses. live.css section 2 does the showing
 * and hiding, so this draws everything and marks what each part is for.
 *
 * Not drawn, because none of them is built: the total, the "Since" line,
 * the source mark, and anything about recordings or memory.
 */

type Zoom = 'list' | 'calendar';
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

/*
 * List or calendar, below desktop. The choice is not a place, so it pushes
 * no history entry and the address does not change (00-flow.md, Back).
 */
function ZoomSwitch({
  zoom,
  choose,
}: {
  zoom: Zoom;
  choose: (zoom: Zoom) => void;
}) {
  return (
    <div className="seg" role="group" aria-label="Zoom">
      <button
        type="button"
        aria-pressed={zoom === 'list'}
        onClick={() => choose('list')}
      >
        List
      </button>
      <button
        type="button"
        aria-pressed={zoom === 'calendar'}
        onClick={() => choose('calendar')}
      >
        Calendar
      </button>
    </div>
  );
}

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/*
 * On desktop a marked day scrolls the list to that day's rows, which carry
 * the id `d-{date}`. It does not follow the link, because following it
 * would push a history entry for every day pressed, and the designer made
 * this a build obligation (direction-lock.md 13.12). Focus moves to the
 * day's own link, so a keyboard carries on from where the eye is.
 *
 * If the day is not in the list, the link is followed as an ordinary one.
 */
function goToInList(event: MouseEvent<HTMLAnchorElement>, date: string) {
  const row = document.getElementById(`d-${date}`);

  if (!row) {
    return;
  }

  event.preventDefault();
  row.scrollIntoView();
  row.querySelector('a')?.focus({ preventScroll: true });
}

/*
 * One month, as the comp draws it: Monday first, the days of the months on
 * either side drawn faintly, and a day with entries in a box. A day with no
 * entries is a number and nothing else: no link and no tap target.
 *
 * `index` is the desktop calendar: a marked day goes to its rows in the
 * list beside it. Otherwise it is the calendar zoom, where there is no list
 * on screen, and a marked day goes to the day's page, as the tablet and
 * mobile comps link it. Today goes to Today, as its row in the list does.
 *
 * The letters of the weekdays and the days of the other months are hidden
 * from a screen reader. Each marked day is named in full.
 */
function MonthGrid({
  calendar,
  today,
  index,
}: {
  calendar: TimelineCalendar;
  today: string;
  index: boolean;
}) {
  return (
    <nav
      className="cal"
      aria-label={formatMonth(calendar.month)}
      data-shows={index ? 'index' : 'calendar'}
    >
      {WEEKDAY_LETTERS.map((letter, at) => (
        <span className="dow" aria-hidden="true" key={at}>
          {letter}
        </span>
      ))}
      {weeksOf(calendar.month, calendar.written)
        .flat()
        .map((cell) => {
          if (!cell.written) {
            return (
              <span
                key={cell.date}
                className={cell.inMonth ? 'day' : 'day out'}
                aria-hidden={cell.inMonth ? undefined : true}
              >
                {cell.day}
              </span>
            );
          }

          const label = writtenDayLabel(cell.date);

          return index ? (
            <a
              key={cell.date}
              className="day has"
              href={`#d-${cell.date}`}
              aria-label={`${label}. Go to it in the list`}
              onClick={(event) => goToInList(event, cell.date)}
            >
              {cell.day}
            </a>
          ) : (
            <Link
              key={cell.date}
              className="day has"
              href={cell.date === today ? '/' : `/d/${cell.date}`}
              aria-label={label}
            >
              {cell.day}
            </Link>
          );
        })}
    </nav>
  );
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

  const [zoom, setZoom] = useState<Zoom>('list');

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
      /* The switch is drawn once there is something to switch between. */
      mastAside={
        view.status === 'open' ? (
          <ZoomSwitch zoom={zoom} choose={setZoom} />
        ) : undefined
      }
      zoom={view.status === 'open' ? zoom : undefined}
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
          <main className="sheet" data-shows="list">
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
          <MonthGrid calendar={view.calendar} today={view.today} index />
          <main className="sheet" data-shows="calendar">
            <h2 className="shead">{formatMonth(view.calendar.month)}</h2>
          </main>
          <MonthGrid
            calendar={view.calendar}
            today={view.today}
            index={false}
          />
          <p className="foot" data-shows="list">
            {view.complete
              ? 'There is nothing earlier in this journal.'
              : 'This list stops here. Your earlier days are still in your journal, and are not listed yet.'}
          </p>
        </>
      ) : null}
    </LiveScreen>
  );
}
