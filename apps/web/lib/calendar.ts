/*
 * The calendar on the Timeline: one month, as weeks of seven days, Monday
 * first, as 02-timeline.html draws it.
 *
 * Everything is worked out from date strings, as YYYY-MM-DD and YYYY-MM.
 * The browser's clock is never read: which month is shown is the month of
 * the API's today, and which days are marked is what GET /days answered.
 *
 * Like timeline.ts, this file is tested with Node alone.
 */

import { formatDayAndMonth } from './format.ts';

export interface CalendarDay {
  date: string;
  /* The number drawn in the cell. */
  day: number;
  /*
   * False for the days of the month before and the month after, which fill
   * the first and last week. They are drawn faintly and are never marked.
   */
  inMonth: boolean;
  /* The day has at least one entry, so it is drawn with a box and is a link. */
  written: boolean;
}

/* A month and a day number as a date: ('2026-08', 3) is '2026-08-03'. */
function dateIn(year: number, month: number, day: number): string {
  /* Date.UTC rolls a day 0 or a 13th month over, as this file needs. */
  const read = new Date(Date.UTC(year, month - 1, day));

  return [
    read.getUTCFullYear(),
    String(read.getUTCMonth() + 1).padStart(2, '0'),
    String(read.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

/* The first and last date of a month, for GET /days?from=&to=. */
export function monthRange(month: string): { from: string; to: string } {
  const [year, number] = month.split('-').map(Number);

  return {
    from: dateIn(year, number, 1),
    /* Day 0 of the next month is the last day of this one. */
    to: dateIn(year, number + 1, 0),
  };
}

/* 0 for Monday to 6 for Sunday. */
function mondayFirst(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/*
 * The weeks of a month, Monday first. The first week starts on the Monday on
 * or before the 1st, and the last week ends on the Sunday on or after the
 * last day, so a month has four, five or six weeks and no empty one.
 *
 * `written` is every date that has an entry. A date outside the month is
 * ignored, even when it is drawn in the first or last week.
 */
export function weeksOf(
  month: string,
  written: readonly string[],
): CalendarDay[][] {
  const [year, number] = month.split('-').map(Number);
  const { from, to } = monthRange(month);
  const marked = new Set(written);

  const first = 1 - mondayFirst(from);
  const last = Number(to.slice(8)) + (6 - mondayFirst(to));

  const weeks: CalendarDay[][] = [];

  for (let start = first; start <= last; start += 7) {
    const week: CalendarDay[] = [];

    for (let offset = 0; offset < 7; offset += 1) {
      const date = dateIn(year, number, start + offset);
      const inMonth = date.slice(0, 7) === month;

      week.push({
        date,
        day: Number(date.slice(8)),
        inMonth,
        written: inMonth && marked.has(date),
      });
    }

    weeks.push(week);
  }

  return weeks;
}

/*
 * What a screen reader says for a marked day, following the comp: "3 August,
 * writing". The comp also says "a recording", and "writing and a recording";
 * there are no recordings, so a day with entries is always "writing".
 */
export function writtenDayLabel(date: string): string {
  return `${formatDayAndMonth(date)}, writing`;
}
