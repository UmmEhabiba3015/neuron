import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { Mood } from '@neuron/contracts';
import { JournalEntry } from '../entries/entry.entity';
import { Day } from './day.entity';

@Injectable()
export class DaysRepository {
  constructor(
    @InjectRepository(Day)
    private readonly days: Repository<Day>,
  ) {}

  async findByDate(userId: string, date: string): Promise<Day | undefined> {
    return (await this.days.findOneBy({ userId, date })) ?? undefined;
  }

  /*
   * Find the day, or create it.
   *
   * The pre-check is an optimisation and the unique index is the guard. Two
   * requests writing the first entry of the same day both see no row, both
   * insert, and one of them loses on UQ_days_user_date -- so the loser reads
   * back the row the winner created rather than failing the request.
   *
   * This is the shape ADR-011 established for registration: application logic
   * decides what to attempt, the constraint decides what can exist.
   */
  async findOrCreate(userId: string, date: string): Promise<Day> {
    const existing = await this.findByDate(userId, date);

    if (existing) {
      return existing;
    }

    const day: Day = {
      id: crypto.randomUUID(),
      date,
      mood: null,
      createdAt: new Date().toISOString(),
      userId,
    };

    try {
      await this.days.insert(day);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const winner = await this.findByDate(userId, date);

      if (!winner) {
        throw error;
      }

      return winner;
    }

    return day;
  }

  async setMood(
    userId: string,
    date: string,
    mood: Mood | null,
  ): Promise<Day | undefined> {
    const day = await this.findOrCreate(userId, date);

    await this.days.update({ id: day.id, userId }, { mood });

    return this.findByDate(userId, date);
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
  async findInRange(userId: string, from: string, to: string): Promise<Day[]> {
    return this.days
      .createQueryBuilder('day')
      .where('day.userId = :userId', { userId })
      .andWhere('day.date BETWEEN :from AND :to', { from, to })
      .andWhere((query) => {
        const liveEntry = query
          .subQuery()
          .select('1')
          .from(JournalEntry, 'entry')
          .where('entry.dayId = day.id')
          .andWhere('entry.userId = :userId')
          .getQuery();

        return `EXISTS ${liveEntry}`;
      })
      .orderBy('day.date', 'DESC')
      .getMany();
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    /UNIQUE constraint failed/i.test(error.message)
  );
}
