import type { Entry } from '@neuron/contracts';
import type { FiledEntry } from '../types/filed-entry.type';

/*
 * An entry as the API sends it. Built field by field, so it holds these four
 * things and nothing else the entity or its day may be carrying. The
 * compiler would not notice an extra field.
 *
 * date is the date of the day row the entry points at.
 */
export class EntryResponseDto implements Entry {
  id: string;
  content: string;
  createdAt: string;
  date: string;

  constructor(entry: FiledEntry) {
    this.id = entry.id;
    this.content = entry.content;
    this.createdAt = entry.createdAt;
    this.date = entry.day.date;
  }
}
