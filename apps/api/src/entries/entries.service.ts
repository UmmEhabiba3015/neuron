import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DaysService } from '../days/days.service';
import { EntriesRepository } from './entries.repository';
import { JournalEntry } from './entry.entity';
import type { EntryFilters } from './entry-filters';
import { FULL_PAGE, type Page } from './page';

@Injectable()
export class EntriesService {
  constructor(
    private readonly entriesRepository: EntriesRepository,
    private readonly daysService: DaysService,
    private readonly dataSource: DataSource,
  ) {}

  find(
    userId: string,
    filters: EntryFilters = {},
    page: Page = FULL_PAGE,
  ): Promise<JournalEntry[]> {
    return this.entriesRepository.find(userId, filters, page);
  }

  count(userId: string, filters: EntryFilters = {}): Promise<number> {
    return this.entriesRepository.count(userId, filters);
  }

  /*
   * Creating the first entry of a day also creates the day, and the two are
   * one atomic operation. If the insert fails after the day row is written,
   * the rollback takes the day with it -- otherwise a failed write leaves an
   * empty day behind, and 00-flow.md is explicit that an empty day does not
   * exist.
   */
  async create(content: string, userId: string): Promise<JournalEntry> {
    const createdAt = new Date().toISOString();

    const id = await this.dataSource.transaction(async (manager) => {
      const day = await this.daysService.resolveFor(userId, createdAt);

      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        content,
        createdAt,
        userId,
        dayId: day.id,
      };

      await manager.insert(JournalEntry, entry);

      return entry.id;
    });

    return (await this.entriesRepository.findById(id, userId))!;
  }

  findById(id: string, userId: string): Promise<JournalEntry | undefined> {
    return this.entriesRepository.findById(id, userId);
  }

  update(
    id: string,
    content: string,
    userId: string,
  ): Promise<JournalEntry | undefined> {
    return this.entriesRepository.update(id, content, userId);
  }

  /*
   * Deleting the last item on a day deletes the day. See discardIfEmpty.
   */
  async delete(id: string, userId: string): Promise<JournalEntry | undefined> {
    const existing = await this.entriesRepository.findWithDay(id, userId);

    const deleted = await this.entriesRepository.delete(id, userId);

    if (deleted && existing?.dayId) {
      await this.daysService.discardIfEmpty(existing.dayId, userId);
    }

    return deleted;
  }
}
