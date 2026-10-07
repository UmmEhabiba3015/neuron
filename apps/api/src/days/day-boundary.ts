import type { User } from '../users/user.entity';

/*
 * The calendar date an instant falls on for one person. A day ends at
 * midnight in that person's timezone (ADR-015), so the same instant is two
 * different dates for two people who are far enough apart.
 *
 * Intl does the work, because the distance between a zone and UTC is not a
 * fixed number: it changes on the days the clocks change, and Intl knows
 * those days.
 *
 * The answer is stored on the row at write time and is not worked out again
 * on read. A person whose timezone changes gets new dates for new entries,
 * and nothing already written moves.
 */
export function dayFor(instant: string | Date, timeZone: string): string {
  const at = typeof instant === 'string' ? new Date(instant) : instant;

  if (Number.isNaN(at.getTime())) {
    throw new TypeError(`Not a valid instant: ${String(instant)}`);
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);

  const part = (type: 'year' | 'month' | 'day'): string =>
    parts.find((each) => each.type === type)!.value;

  return `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`;
}

/*
 * Whose day it is: the id says which person, the timezone says where their
 * midnight falls. They travel together so that one person's id can never be
 * paired with another person's zone.
 */
export type DayOwner = Pick<User, 'id' | 'timezone'>;
