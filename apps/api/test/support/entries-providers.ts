import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DayEntity } from '../../src/days/entities/day.entity';
import { DaysRepository } from '../../src/days/days.repository';
import { DaysService } from '../../src/days/days.service';
import { AudioStorage } from '../../src/entries/audio-storage';
import { EntriesRepository } from '../../src/entries/entries.repository';
import { EntriesService } from '../../src/entries/entries.service';
import { EntryEntity } from '../../src/entries/entities/entry.entity';

/*
 * A folder of its own for one test's recordings, in the system's temporary
 * folder and never in apps/api/data.
 */
export function temporaryAudioStorage(): AudioStorage {
  return new AudioStorage(mkdtempSync(join(tmpdir(), 'neuron-audio-')));
}

/*
 * Everything EntriesService needs, in one place, so a new dependency is added
 * once and not in every spec.
 */
export function entriesProviders(
  dataSource: DataSource,
  audioStorage: AudioStorage = temporaryAudioStorage(),
) {
  return [
    { provide: AudioStorage, useValue: audioStorage },
    EntriesService,
    EntriesRepository,
    DaysService,
    DaysRepository,
    { provide: DataSource, useValue: dataSource },
    {
      provide: getRepositoryToken(EntryEntity),
      useValue: dataSource.getRepository(EntryEntity),
    },
    {
      provide: getRepositoryToken(DayEntity),
      useValue: dataSource.getRepository(DayEntity),
    },
  ];
}
