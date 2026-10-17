import type { ExportedDay, Mood } from '@neuron/contracts';
import { EntryResponseDto } from '../../shared/dto/entry-response.dto';
import type { ExportedEntryRow } from '../types/exported-entry-row.type';

/*
 * One day of journal.json: its date, its mood, and its live entries, oldest
 * first. Each entry is the same shape GET /entries answers with.
 */
export class ExportedDayDto implements ExportedDay {
  date: string;
  mood: Mood | null;
  entries: EntryResponseDto[];

  constructor(rows: ExportedEntryRow[]) {
    this.date = rows[0].day.date;
    this.mood = rows[0].day.mood;
    this.entries = rows.map((row) => new EntryResponseDto(row));
  }
}
