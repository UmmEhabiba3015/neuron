import { Injectable } from '@nestjs/common';
import { EntryKind } from '@neuron/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Raw, Repository, type FindOptionsWhere } from 'typeorm';
import { EntryEntity } from './entities/entry.entity';
import type { FiledEntry } from '../shared/types/filed-entry.type';
import type { EntryFilters } from './types/entry-filters.interface';
import type { StoredAudio } from './types/stored-audio.interface';
import type { Page } from '../shared/types/page.interface';

@Injectable()
export class EntriesRepository {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly entries: Repository<EntryEntity>,
  ) {}

  find(
    userId: string,
    filters: EntryFilters,
    page: Page,
  ): Promise<FiledEntry[]> {
    return this.filed(whereFor(userId, filters))
      .limit(page.limit)
      .offset(page.offset)
      .getMany() as Promise<FiledEntry[]>;
  }

  count(userId: string, filters: EntryFilters): Promise<number> {
    return this.entries.count({ where: whereFor(userId, filters) });
  }

  async findById(id: string, userId: string): Promise<FiledEntry | undefined> {
    const entry = await this.filed({ id, userId }).getOne();

    return (entry as FiledEntry | null) ?? undefined;
  }

  /*
   * Every read of an entry, with the date of its day joined on, in one
   * query however many entries come back.
   *
   * The columns are named, so user_id, day_id, deleted_at and a memo's
   * audio_key and audio_type are not read, and of the day only its date is.
   *
   * limit and offset count rows of the joined result. That is the same as
   * counting entries here, because an entry points at exactly one day, so
   * the join never turns one entry into two rows.
   */
  private filed(where: FindOptionsWhere<EntryEntity>) {
    return this.entries.createQueryBuilder('entry').setFindOptions({
      where,
      relations: { day: true },
      select: {
        id: true,
        kind: true,
        content: true,
        durationMs: true,
        createdAt: true,
        day: { date: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async save(entry: EntryEntity): Promise<void> {
    await this.entries.insert(entry);
  }

  async update(
    id: string,
    content: string,
    userId: string,
  ): Promise<FiledEntry | undefined> {
    /*
     * @DeleteDateColumn filters reads and does not filter an update. Without
     * the condition on deletedAt this would change a deleted entry.
     *
     * Only a typed entry is changed. A voice memo's words will be its
     * transcript, which nobody edits (features.md, Refs 11 and 24).
     */
    const result = await this.entries.update(
      { id, userId, kind: EntryKind.Text, deletedAt: IsNull() },
      { content },
    );

    if (result.affected === 0) {
      return undefined;
    }

    return this.findById(id, userId);
  }

  /*
   * Where a voice memo's audio is. The owner is in the WHERE clause (ADR-013),
   * so another person's memo is not found, and so is the kind, so a typed
   * entry has no audio to find. A deleted memo is left out by
   * @DeleteDateColumn, as from every read.
   */
  async findAudio(
    id: string,
    userId: string,
  ): Promise<StoredAudio | undefined> {
    const entry = await this.entries.findOne({
      where: { id, userId, kind: EntryKind.Voice },
      select: { id: true, audioKey: true, audioType: true },
    });

    if (!entry?.audioKey || !entry.audioType) {
      return undefined;
    }

    return { audioKey: entry.audioKey, audioType: entry.audioType };
  }

  /*
   * A soft delete (ADR-020): the row stays and deleted_at is set. This is an
   * update and not TypeORM's softDelete, which writes the database's
   * CURRENT_TIMESTAMP. Every other time in this project is an ISO 8601
   * string from the application's clock, so the caller passes one in.
   *
   * The condition on deletedAt is written by hand for the same reason as in
   * update. It is what makes a second delete find nothing and leave the
   * first time in place.
   */
  async markDeleted(
    id: string,
    userId: string,
    deletedAt: string,
  ): Promise<boolean> {
    const result = await this.entries.update(
      { id, userId, deletedAt: IsNull() },
      { deletedAt },
    );

    return result.affected !== 0;
  }
}

/*
 * One place that turns filters into a where clause. Every read that answers
 * "which entries" goes through it, so a filter added here reaches the
 * listing, the search and the count at once.
 */
function whereFor(
  userId: string,
  filters: EntryFilters,
): FindOptionsWhere<EntryEntity> {
  const where: FindOptionsWhere<EntryEntity> = { userId };

  /*
   * "Written on that day" is the day row the entry points at, not a window
   * on created_at. Midnight in the author's timezone was applied once, when
   * the entry was assigned its day. Comparing instants here would apply it
   * again, in a second place, with whatever timezone the author has now.
   *
   * The owner is still the entry's own user_id, above. The day is only ever
   * consulted for its date.
   */
  if (filters.date !== undefined) {
    where.day = { date: filters.date };
  }

  if (filters.kind !== undefined) {
    where.kind = filters.kind;
  }

  /*
   * An empty search term is a search that matches nothing, not a search that
   * was never made. Day 5 chose that deliberately: ?word= falling through to
   * "everything" is a search box that answers a request for nothing with the
   * whole journal. IS NULL on a NOT NULL column is how that is said in a
   * where clause, so the listing and the count agree on it without either
   * having to special-case it first.
   *
   * It is asked of id and not of content, because content is NULL for a
   * voice memo without a transcript, and IS NULL would find every one.
   */
  if (filters.word === '') {
    where.id = IsNull();

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
