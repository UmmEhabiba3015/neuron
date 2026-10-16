/*
 * The Timezone screen: the list to choose from, how each zone is written,
 * and what an answer to "Save timezone" means.
 *
 * Like recover.ts, this file has no React in it and is tested with Node
 * alone. Intl is the browser's own, and is not an import.
 */
import type { User } from '@neuron/contracts';
import type { ApiResult } from './api/session.ts';

/*
 * How far a zone's clock is from UTC at one moment, as "UTC+5", "UTC-4" or
 * "UTC+5:30". The distance changes on the days the clocks change, so the
 * moment is handed in, and is the moment the screen is drawn.
 */
export function utcOffset(timeZone: string, at: Date): string {
  const name =
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';

  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name);

  if (!match) {
    return 'UTC+0';
  }

  const [, sign, hours, minutes] = match;

  return `UTC${sign}${Number(hours)}${minutes === '00' ? '' : `:${minutes}`}`;
}

/* A zone as Account and the list write it: "Asia/Karachi (UTC+5)". */
export function timezoneLabel(timeZone: string, at: Date): string {
  return `${timeZone} (${utcOffset(timeZone, at)})`;
}

export interface TimezoneChoice {
  value: string;
  label: string;
}

/*
 * The zones the browser knows, in its order, each with its label. The
 * person's own zone is always in the list, so it can be the one chosen: a
 * browser may not list it under the name the API stored it under, and UTC,
 * which older accounts have, is not in every browser's list.
 */
export function timezoneChoices(
  zones: readonly string[],
  current: string,
  at: Date,
): TimezoneChoice[] {
  const all = zones.includes(current) ? zones : [current, ...zones];

  return all.map((zone) => ({ value: zone, label: timezoneLabel(zone, at) }));
}

/*
 * `saved`       the API has the new timezone.
 * `refused`     the API refused the zone itself. Only a browser whose list
 *               names a zone the server's does not know can bring this.
 * `unreachable` no answer arrived, so nothing was changed.
 * `failed`      any other answer. Nothing was changed.
 * `ended`       the session is over, and the sign-in screen follows.
 */
export type TimezoneSave =
  | 'saved'
  | 'refused'
  | 'unreachable'
  | 'failed'
  | 'ended';

export function timezoneSaveOutcome(result: ApiResult<User>): TimezoneSave {
  if (result.kind === 'ok') {
    return 'saved';
  }

  if (result.kind === 'rejected') {
    return result.status === 400 ? 'refused' : 'failed';
  }

  return result.kind;
}

/* What the screen says when the timezone was not changed. */
export function notSavedSentence(
  outcome: 'refused' | 'unreachable' | 'failed',
  chosen: string,
  current: string,
): string {
  const still = `Your timezone is still ${current}.`;

  switch (outcome) {
    case 'refused':
      return `The server does not accept ${chosen} as a timezone. ${still} Choose another.`;
    case 'unreachable':
      return `We could not reach the server. ${still} Try again.`;
    case 'failed':
      return `Something went wrong on our side. ${still} Try again.`;
  }
}
