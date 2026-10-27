/*
 * The only file in apps/web that reads the clock (ADR-015). eslint.config.mjs
 * forbids `new Date()` and `Date.now()` everywhere else.
 *
 * The browser's clock never makes a date: which day an entry belongs to,
 * and which day is today, are the server's to say. So nothing here returns
 * a Date or a timestamp. What it returns is text that is only drawn, and a
 * clock that measures how long something lasts.
 */
import type { Clock } from '../recorder.ts';
import {
  timezoneChoices,
  timezoneLabel,
  type TimezoneChoice,
} from '../timezone.ts';

/*
 * A zone as Account writes it now: "Asia/Karachi (UTC+5)". The distance
 * from UTC changes on the days the clocks change, so it is read at the
 * moment the screen is drawn.
 */
export function timezoneLabelNow(timeZone: string): string {
  return timezoneLabel(timeZone, new Date());
}

/* The list of the Timezone screen, each zone labelled as it is now. */
export function timezoneChoicesNow(
  zones: readonly string[],
  current: string,
): TimezoneChoice[] {
  return timezoneChoices(zones, current, new Date());
}

/*
 * The clock of the page, for the recorder on Talk. It measures how long a
 * recording has lasted, and nothing else, so it reads `performance.now()`,
 * which counts from the page's opening and is never moved when the device's
 * clock is changed.
 */
export const systemClock: Clock = {
  now: () => performance.now(),
  every(milliseconds, run) {
    const timer = setInterval(run, milliseconds);
    return () => clearInterval(timer);
  },
  after(milliseconds, run) {
    const timer = setTimeout(run, milliseconds);
    return () => clearTimeout(timer);
  },
};
