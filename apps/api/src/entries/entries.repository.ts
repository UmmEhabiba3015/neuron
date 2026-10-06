import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Raw, Repository, type FindOptionsWhere } from 'typeorm';
import { JournalEntry } from './entry.entity';
import type { EntryFilters } from './entry-filters';
import type { Page } from './page';

@Injectable()
export class EntriesRepository {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly entries: Repository<JournalEntry>,
  ) {}

  find(
    userId: string,
    filters: EntryFilters,
    page: Page,
  ): Promise<JournalEntry[]> {
    return this.entries.find({
      where: whereFor(userId, filters),
      order: { createdAt: 'DESC' },
      take: page.limit,
      skip: page.offset,
    });
  }

  /*
   * The same where clause the listing uses, so the two cannot disagree.
   * They did: count ignored the search term entirely, so counting a search
   * returned the size of the whole journal.
   */
  count(userId: string, filters: EntryFilters): Promise<number> {
    return this.entries.count({ where: whereFor(userId, filters) });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<JournalEntry | undefined> {
    return (await this.entries.findOneBy({ id, userId })) ?? undefined;
  }

  /*
   * findById hides day_id, because select:false keeps it off every response.
   * Deleting a day when its last entry goes needs the id, so this is the one
   * read that asks for it explicitly.
   */
  async findWithDay(
    id: string,
    userId: string,
  ): Promise<JournalEntry | undefined> {
    return (
      (await this.entries.findOne({
        where: { id, userId },
        select: { id: true, dayId: true },
      })) ?? undefined
    );
  }

  async save(entry: JournalEntry): Promise<void> {
    await this.entries.insert(entry);
  }

  async update(
    id: string,
    content: string,
    userId: string,
  ): Promise<JournalEntry | undefined> {
    const result = await this.entries.update({ id, userId }, { content });

    if (result.affected === 0) {
      return undefined;
    }

    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<JournalEntry | undefined> {
    const existing = await this.findById(id, userId);

    if (!existing) {
      return undefined;
    }

    const result = await this.entries.delete({ id, userId });

    if (result.affected === 0) {
      return undefined;
    }

    return existing;
  }
}

/*
 * One place that turns filters into a where clause. Every read that answers
 * "which entries" goes through it -- the listing, the search and the count --
 * so a filter added here reaches all of them at once. Three separate clauses
 * is how count came to ignore the search term.
 */
function whereFor(
  userId: string,
  filters: EntryFilters,
): FindOptionsWhere<JournalEntry> {
  const where: FindOptionsWhere<JournalEntry> = { userId };

  /*
   * "Written on that day" is the day row the entry points at, not a window
   * on created_at. The 4am boundary was applied once, when the entry was
   * assigned its day, and comparing instants here would apply it again in a
   * second place that could come to disagree with the first.
   *
   * The owner is still the entry's own user_id, above. The day is only ever
   * consulted for its date.
   */
  if (filters.date !== undefined) {
    where.day = { date: filters.date };
  }

  /*
   * An empty search term is a search that matches nothing, not a search that
   * was never made. Day 5 chose that deliberately: ?word= falling through to
   * "everything" is a search box that answers a request for nothing with the
   * whole journal. IS NULL on a NOT NULL column is how that is said in a
   * where clause, so the listing and the count agree on it without either
   * having to special-case it first.
   */
  if (filters.word === '') {
    where.content = IsNull();

    return where;
  }

  if (filters.word !== undefined) {
    where.content = Raw(
      (alias) => `${alias} LIKE :pattern ESCAPE '${LIKE_ESCAPE_CHARACTER}'`,
      { pattern: `%${escapeLikePattern(filters.word)}%` },
    );
  }

  return where;
}

const LIKE_ESCAPE_CHARACTER = '\\';

function escapeLikePattern(term: string): string {
  return term
    .replaceAll(
      LIKE_ESCAPE_CHARACTER,
      LIKE_ESCAPE_CHARACTER + LIKE_ESCAPE_CHARACTER,
    )
    .replaceAll('%', LIKE_ESCAPE_CHARACTER + '%')
    .replaceAll('_', LIKE_ESCAPE_CHARACTER + '_');
}
