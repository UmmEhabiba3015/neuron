import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntryEntity } from '../entries/entities/entry.entity';
import type { ExportedEntryRow } from './types/exported-entry-row.type';

@Injectable()
export class ExportRepository {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly entries: Repository<EntryEntity>,
  ) {}

  /*
   * Every live entry of one person, oldest first: by the date of the day it
   * was filed on, then by the time it was written. The owner is in the WHERE
   * clause (ADR-013), and @DeleteDateColumn leaves deleted entries out
   * (ADR-020) without a word about them here.
   */
  async liveEntriesOf(userId: string): Promise<ExportedEntryRow[]> {
    return (await this.entries.find({
      where: { userId },
      relations: { day: true },
      select: {
        id: true,
        kind: true,
        content: true,
        durationMs: true,
        createdAt: true,
        keptOutOfMemory: true,
        audioKey: true,
        audioType: true,
        day: { id: true, date: true, mood: true },
      },
      order: { day: { date: 'ASC' }, createdAt: 'ASC' },
    })) as ExportedEntryRow[];
  }
}
