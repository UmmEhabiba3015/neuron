import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { DayOwner } from '../days/day-boundary';
import { DaysService } from '../days/days.service';
import { EntriesRepository } from './entries.repository';
import { JournalEntry, type FiledEntry } from './entry.entity';
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
  ): Promise<FiledEntry[]> {
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
  async create(content: string, author: DayOwner): Promise<FiledEntry> {
    const createdAt = new Date().toISOString();

    const id = await this.dataSource.transaction(async (manager) => {
      const day = await this.daysService.resolveFor(author, createdAt);

      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        content,
        createdAt,
        userId: author.id,
        dayId: day.id,
      };

      await manager.insert(JournalEntry, entry);

      return entry.id;
    });

    return (await this.entriesRepository.findById(id, author.id))!;
  }

  findById(id: string, userId: string): Promise<FiledEntry | undefined> {
    return this.entriesRepository.findById(id, userId);
  }

  update(
    id: string,
    content: string,
    userId: string,
  ): Promise<FiledEntry | undefined> {
    return this.entriesRepository.update(id, content, userId);
  }

  /*
   * The entry's day is left alone, mood included. An emptied day is kept off
   * the calendar by the range listing and not by removing its row.
   */
  delete(id: string, userId: string): Promise<boolean> {
    return this.entriesRepository.markDeleted(
      id,
      userId,
      new Date().toISOString(),
    );
  }
}
