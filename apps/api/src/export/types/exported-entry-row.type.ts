import type { DayEntity } from '../../days/entities/day.entity';
import type { EntryEntity } from '../../entries/entities/entry.entity';

/*
 * A live entry as the export reads it: with its day's date and mood, and,
 * for a voice memo, where its audio is. The audio key never leaves the API;
 * it is used to put the file in the ZIP.
 */
export type ExportedEntryRow = EntryEntity & {
  day: Pick<DayEntity, 'date' | 'mood'>;
};
