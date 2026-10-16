import type { FiledEntry } from './filed-entry.type';

/*
 * What an edit came to. A voice memo is found and still refused, which is a
 * different answer from an entry that is not there (features.md, Ref 11).
 */
export type UpdateOutcome =
  | { status: 'updated'; entry: FiledEntry }
  | { status: 'notFound' }
  | { status: 'isVoiceMemo' };
