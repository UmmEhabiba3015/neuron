import type { JournalExport } from '@neuron/contracts';
import { UserResponseDto } from '../../shared/dto/user-response.dto';
import type { UserEntity } from '../../users/entities/user.entity';
import type { ExportedEntryRow } from '../types/exported-entry-row.type';
import { ExportedDayDto } from './exported-day.dto';

/*
 * journal.json. Built from the contract's shapes only, so it holds nothing
 * the API does not already send: no audio key, no password hash. The words
 * are kept exactly as written, emoji included; only the PDF replaces what
 * its font cannot draw (ADR-025).
 *
 * The rows arrive oldest first, so a day's entries are next to each other.
 */
export class JournalExportDto implements JournalExport {
  exportedAt: string;
  user: UserResponseDto;
  days: ExportedDayDto[];

  constructor(user: UserEntity, rows: ExportedEntryRow[], exportedAt: string) {
    this.exportedAt = exportedAt;
    this.user = new UserResponseDto(user);
    this.days = [];

    let day: ExportedEntryRow[] = [];

    for (const row of rows) {
      if (day.length > 0 && day[0].day.date !== row.day.date) {
        this.days.push(new ExportedDayDto(day));
        day = [];
      }

      day.push(row);
    }

    if (day.length > 0) {
      this.days.push(new ExportedDayDto(day));
    }
  }
}
