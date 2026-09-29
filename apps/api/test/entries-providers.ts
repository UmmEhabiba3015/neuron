import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Day } from '../src/days/day.entity';
import { DaysRepository } from '../src/days/days.repository';
import { DaysService } from '../src/days/days.service';
import { EntriesRepository } from '../src/entries/entries.repository';
import { EntriesService } from '../src/entries/entries.service';
import { JournalEntry } from '../src/entries/entry.entity';

/*
 * Everything EntriesService needs, in one place.
 *
 * Three specs each assembled this list by hand, so giving the service a new
 * dependency broke all three with a DI error rather than with anything that
 * pointed at the change. Same shape as the entity list: repeat a registration
 * and it will be forgotten.
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
