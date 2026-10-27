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
  /* The person's own zone, which the list opens on. Exactly one is. */
  chosen: boolean;
}

/*
 * The name this browser gives a zone. Two names can be one zone: the API
 * stores Node's name, such as Asia/Calcutta, and Firefox lists the same zone
 * as Asia/Kolkata. A name the browser does not know is kept as it is.
 */
export function browserZoneName(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions()
      .timeZone;
  } catch {
    return timeZone;
  }
}

/*
 * The zones the browser knows, in its order, each with its label, and the
 * person's own zone marked as chosen. It is compared by the browser's own
 * name for it, and shown under that name, so one zone is never listed
 * twice. It is added at the top only when even that name is absent: UTC,
 * which older accounts have, is not in every browser's list.
 *
 * `nameOf` is the browser's naming. It is handed in only by a test, because
 * Node, which runs the tests, names zones as the API does and not as
 * Firefox does.
 */
export function timezoneChoices(
  zones: readonly string[],
  current: string,
  at: Date,
  nameOf: (timeZone: string) => string = browserZoneName,
): TimezoneChoice[] {
  const own = zones.includes(current) ? current : nameOf(current);
  const all = zones.includes(own) ? zones : [own, ...zones];

  return all.map((zone) => ({
    value: zone,
    label: timezoneLabel(zone, at),
    chosen: zone === own,
  }));
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
