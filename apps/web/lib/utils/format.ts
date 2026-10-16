const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const LONG_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/*
 * True for a real calendar date written as YYYY-MM-DD, and for nothing else:
 * not 2026-02-31, and not a date with anything before or after it. This is
 * the API's rule for a date in an address, so an address the API would
 * refuse is never sent to it.
 */
export function isCalendarDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }

  const [year, month, day] = text.split('-').map(Number);
  const read = new Date(Date.UTC(year, month - 1, day));

  /* A day that does not exist rolls over into the next month. */
  return (
    read.getUTCFullYear() === year &&
    read.getUTCMonth() === month - 1 &&
    read.getUTCDate() === day
  );
}

function weekdayOf(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/* The month a date is in, as "2026-08". Two of them compare as text. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/* A month from `monthOf`, as "August 2026". */
export function formatMonth(month: string): string {
  const [year, number] = month.split('-').map(Number);

  return `${LONG_MONTHS[number - 1]} ${year}`;
}

/* A day and its month, with no weekday or year, as "3 August". */
export function formatDayAndMonth(date: string): string {
  const [, month, day] = date.split('-').map(Number);

  return `${day} ${LONG_MONTHS[month - 1]}`;
}

/* A day inside its month on the Timeline, as "Sun 9". */
export function formatDayOfMonth(date: string): string {
  return `${WEEKDAYS[weekdayOf(date)]} ${Number(date.slice(8))}`;
}

/* A day said in full, for a screen reader: "Sunday 9 August 2026". */
export function formatLongDay(date: string): string {
  const day = Number(date.slice(8));

  return `${LONG_WEEKDAYS[weekdayOf(date)]} ${day} ${formatMonth(monthOf(date))}`;
}

/*
 * The date is read as three numbers and never as a moment in time, so the
 * timezone of the browser cannot move it to the day before or after.
 */
export function formatDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const shortYear = String(year).slice(-2);

  return `${WEEKDAYS[weekday]} ${day} ${MONTHS[month - 1]} '${shortYear}`;
}

/*
 * The time an entry was written, as "09:20", on the clock of the device
 * showing it.
 */
export function formatTime(instant: string): string {
  const at = new Date(instant);
  const hours = String(at.getHours()).padStart(2, '0');
  const minutes = String(at.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/*
 * The date an instant falls on in a timezone, as "30 September 2026". The
 * timezone is the person's, as the API holds it, and never the browser's, so
 * a device somewhere else shows the same date.
 */
export function formatDateIn(instant: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(instant));

  const part = (type: 'year' | 'month' | 'day'): number =>
    Number(parts.find((each) => each.type === type)!.value);

  return `${part('day')} ${LONG_MONTHS[part('month') - 1]} ${part('year')}`;
}

/*
 * A length of time as a clock reads it: "0:00", "1:12", "10:00". Seconds
 * that have not been completed are not counted, so the clock of a recording
 * changes once a second has passed, and never shows more than was recorded.
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/*
 * The same length in words, for a screen reader: "1 minute 12 seconds",
 * "45 seconds", "2 minutes". "1:12" read aloud is a time of day.
 */
export function speakDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const count = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

  if (minutes === 0) {
    return count(rest, 'second');
  }

  return rest === 0
    ? count(minutes, 'minute')
    : `${count(minutes, 'minute')} ${count(rest, 'second')}`;
}
