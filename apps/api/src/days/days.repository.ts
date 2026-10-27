import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';
import type { Mood } from '@neuron/contracts';
import { EntryEntity } from '../entries/entities/entry.entity';
import { DayEntity } from './entities/day.entity';

@Injectable()
export class DaysRepository {
  constructor(
    @InjectRepository(DayEntity)
    private readonly days: Repository<DayEntity>,
  ) {}

  async findByDate(
    userId: string,
    date: string,
    manager: EntityManager = this.days.manager,
  ): Promise<DayEntity | undefined> {
    return (await manager.findOneBy(DayEntity, { userId, date })) ?? undefined;
  }

  /*
   * Find the day, or create it.
   *
   * The pre-check is an optimisation and the unique index is the guard. Two
   * requests writing the first entry of the same day both see no row and
   * both insert. ON CONFLICT DO NOTHING makes the loser's insert, on
   * UQ_days_user_date, insert nothing instead of failing, and the read after
   * it finds the row the winner created. If the winner has not committed
   * yet, Postgres makes the loser's insert wait until it has.
   *
   * It is not a caught unique violation, as it was on SQLite, because this
   * runs inside the transaction that files an entry, and on Postgres an
   * error ends a transaction: the read after the catch would fail too.
   *
   * The manager is the transaction's when an entry is being filed, so the
   * day and the entry are written together or not at all.
   *
   * This is the shape ADR-011 established for registration: application logic
   * decides what to attempt, the constraint decides what can exist.
   */
  async findOrCreate(
    userId: string,
    date: string,
    manager: EntityManager = this.days.manager,
  ): Promise<DayEntity> {
    const existing = await this.findByDate(userId, date, manager);

    if (existing) {
      return existing;
    }

    const day: DayEntity = {
      id: crypto.randomUUID(),
      date,
      mood: null,
      createdAt: new Date().toISOString(),
      userId,
    };

    await manager
      .createQueryBuilder()
      .insert()
      .into(DayEntity)
      .values(day)
      .orIgnore()
      .execute();

    const stored = await this.findByDate(userId, date, manager);

    if (!stored) {
      throw new Error(`The day ${date} was neither found nor created.`);
    }

    return stored;
  }

  async setMood(
    userId: string,
    date: string,
    mood: Mood | null,
  ): Promise<DayEntity | undefined> {
    const day = await this.findOrCreate(userId, date);

    await this.days.update({ id: day.id, userId }, { mood });

    return this.findByDate(userId, date);
  }

  /*
   * Whether the person has an entry that is not deleted on this date. The
   * subquery is findInRange's, for the same reasons: it selects from the
   * entry entity, so deleted entries are left out without a word about
   * deleted_at, and the entry is matched on its owner as well as its day.
   */
  async hasLiveEntry(userId: string, date: string): Promise<boolean> {
    return this.days
      .createQueryBuilder('day')
      .where('day.userId = :userId', { userId })
      .andWhere('day.date = :date', { date })
      .andWhere((query) => {
        const liveEntry = query
          .subQuery()
          .select('1')
          .from(EntryEntity, 'entry')
          .where('entry.dayId = day.id')
          .andWhere('entry.userId = :userId')
          .getQuery();

        return `EXISTS ${liveEntry}`;
      })
      .getExists();
  }

  /*
   * A date is listed only if it has at least one entry that is not deleted
   * (ADR-020). A mood alone does not list a date, and neither does a day
   * whose entries were all deleted: the row is still there, and this is
   * what keeps it off the calendar.
   *
   * Nothing here mentions deleted_at. The subquery selects from the
   * JournalEntry entity, so @DeleteDateColumn adds the condition to it. The
   * same query written as raw SQL would count deleted entries.
   *
   * The entry is matched on its owner as well as its day, because ownership
   * belongs in the WHERE clause (ADR-013).
   */
  async findInRange(
    userId: string,
    from: string,
    to: string,
  ): Promise<DayEntity[]> {
    return this.days
      .createQueryBuilder('day')
      .where('day.userId = :userId', { userId })
      .andWhere('day.date BETWEEN :from AND :to', { from, to })
      .andWhere((query) => {
        const liveEntry = query
          .subQuery()
          .select('1')
          .from(EntryEntity, 'entry')
          .where('entry.dayId = day.id')
          .andWhere('entry.userId = :userId')
          .getQuery();

        return `EXISTS ${liveEntry}`;
      })
      .orderBy('day.date', 'DESC')
      .getMany();
  }
}
