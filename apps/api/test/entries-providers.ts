import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Day } from '../src/days/day.entity';
import { DaysRepository } from '../src/days/days.repository';
import { DaysService } from '../src/days/days.service';
import { EntriesRepository } from '../src/entries/entries.repository';
import { EntriesService } from '../src/entries/entries.service';
import { JournalEntry } from '../src/entries/entry.entity';

/*
 * Everything EntriesService needs, in one place, so a new dependency is added
 * once and not in every spec.
 */
export function entriesProviders(dataSource: DataSource) {
  return [
    EntriesService,
    EntriesRepository,
    DaysService,
    DaysRepository,
    { provide: DataSource, useValue: dataSource },
    {
      provide: getRepositoryToken(JournalEntry),
      useValue: dataSource.getRepository(JournalEntry),
    },
    {
      provide: getRepositoryToken(Day),
      useValue: dataSource.getRepository(Day),
    },
  ];
}
