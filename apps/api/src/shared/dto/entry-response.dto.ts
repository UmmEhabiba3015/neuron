import type { Entry, EntryKind } from '@neuron/contracts';
import type { FiledEntry } from '../types/filed-entry.type';

/*
 * An entry as the API sends it. Built field by field, so it holds these six
 * things and nothing else the entity or its day may be carrying: a voice
 * memo's audio key in particular never leaves the API. The compiler would
 * not notice an extra field.
 *
 * date is the date of the day row the entry points at.
 */
export class EntryResponseDto implements Entry {
  id: string;
  kind: EntryKind;
  content: string | null;
  durationMs: number | null;
  createdAt: string;
  date: string;

  constructor(entry: FiledEntry) {
    this.id = entry.id;
    this.kind = entry.kind;
    this.content = entry.content;
    this.durationMs = entry.durationMs;
    this.createdAt = entry.createdAt;
    this.date = entry.day.date;
  }
}
