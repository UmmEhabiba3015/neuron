/*
 * Your data (docs/features.md, Refs 36, 8 and 37): the counts, the export,
 * and deleting the account. Like timezone.ts, this file has no React in it
 * and is tested with Node alone. It says what happened, and the screen says
 * it in words.
 */
import { EntryKind } from '@neuron/contracts';
import type {
  ApiResult,
  DeleteAccountOutcome,
  ReceivedFile,
} from './api/session.ts';
import { formatMonth } from './utils/format.ts';

/* The two counts the screen asks for: typed entries, and voice memos. */
export const COUNT_PATHS = {
  entries: `/entries/count?kind=${EntryKind.Text}`,
  recordings: `/entries/count?kind=${EntryKind.Voice}`,
} as const;

export interface Counts {
  entries: number;
  recordings: number;
}

/* Both answers, or nothing: half a count would be a wrong count. */
export function countsFrom(
  entries: ApiResult<{ count: number }>,
  recordings: ApiResult<{ count: number }>,
): Counts | null {
  if (entries.kind !== 'ok' || recordings.kind !== 'ok') {
    return null;
  }

  return { entries: entries.data.count, recordings: recordings.data.count };
}

/*
 * "12 entries, 3 recordings", in its two parts: "12 entries," and
 * "3 recordings". A memo is counted only as a recording, so the two never
 * count the same thing. A narrow screen may break the line only between the
 * parts, never inside one (her choice, feature 7), so the screen keeps each
 * part on one line.
 */
export function countsParts({ entries, recordings }: Counts): [string, string] {
  const count = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  return [
    `${count(entries, 'entry', 'entries')},`,
    count(recordings, 'recording', 'recordings'),
  ];
}

/*
 * Pressing "Export everything". An account known to hold nothing is told so,
 * and nothing is sent. When the counts are not known, the export is asked
 * for, and the API answers with what there is.
 */
export function exportStart(counts: Counts | null): 'nothing' | 'send' {
  return counts !== null && counts.entries === 0 && counts.recordings === 0
    ? 'nothing'
    : 'send';
}

/*
 * The name the API gave the file, from its Content-Disposition header. The
 * date in it is the API's, in the person's timezone, and never the
 * browser's clock (ADR-015). Without one, the file still has a name.
 */
export const FALLBACK_FILENAME = 'neuron-export.zip';

export function filenameFrom(disposition: string | null): string {
  const match = /filename="([^"]+)"/.exec(disposition ?? '');

  return match ? match[1] : FALLBACK_FILENAME;
}

export type ExportOutcome =
  | { kind: 'ready'; blob: Blob; filename: string }
  | { kind: 'unreachable' }
  | { kind: 'failed' }
  | { kind: 'ended' };

export function exportOutcome(result: ApiResult<ReceivedFile>): ExportOutcome {
  if (result.kind === 'ok') {
    return {
      kind: 'ready',
      blob: result.data.blob,
      filename: filenameFrom(result.data.disposition),
    };
  }

  return result.kind === 'rejected' ? { kind: 'failed' } : result;
}

/* Her words, 2026-10-16. */
export const EXPORT_ROW =
  'Your journal as a PDF and as JSON, and your recordings as audio files, in one download.';
export const NOTHING_TO_EXPORT = 'There is nothing to export yet.';
export const DELETE_QUESTION = 'Delete your account?';
export const DELETE_WARNING =
  'This deletes every entry, recording and mood, and signs out every device. It cannot be undone.';
export const ACCOUNT_DELETED = 'Your account has been deleted.';

/*
 * What the dialog says after a press of "Delete account" that did not
 * delete it. `deleted` and `ended` say nothing here: the person is signed
 * out, and sign in speaks.
 */
export function notDeletedSentence(
  outcome: DeleteAccountOutcome,
): string | null {
  switch (outcome) {
    case 'wrongPassword':
      return 'That password is not right. Your account has not been deleted.';
    case 'unreachable':
      return 'We could not reach the server. Your account has not been deleted.';
    case 'failed':
      return 'Something went wrong on our side. Your account has not been deleted.';
    default:
      return null;
  }
}

/*
 * Where a deleted account lands. Sign in reads the mark and says what
 * happened, as it does after a password reset.
 */
export const SIGN_IN_AFTER_DELETE = '/in?deleted=done';

export function isAfterDelete(mark: string | string[] | undefined): boolean {
  return mark === 'done';
}

/*
 * "since October 2026" (her words, 2026-10-17), under the key "Keeping":
 * the month the account was created, in the person's timezone, so that an
 * account made late on the last night of a month is kept since that month
 * wherever it is read.
 */
export function keepingSince(createdAt: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(createdAt));

  const part = (type: 'year' | 'month') =>
    parts.find((each) => each.type === type)!.value;

  return `since ${formatMonth(`${part('year')}-${part('month')}`)}`;
}
