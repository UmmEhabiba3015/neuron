import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, QueryFailedError, Repository } from 'typeorm';
import type { Mood } from '@neuron/contracts';
import { Day } from './day.entity';

@Injectable()
export class DaysRepository {
  constructor(
    @InjectRepository(Day)
    private readonly days: Repository<Day>,
    private readonly dataSource: DataSource,
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

  async findInRange(userId: string, from: string, to: string): Promise<Day[]> {
    return this.days.find({
      where: { userId, date: Between(from, to) },
      order: { date: 'DESC' },
    });
  }

  /*
   * The count is scoped by user as well as by day, and that is not redundant:
   * ownership belongs in the WHERE clause rather than in the caller
   * (ADR-013).
   */
  async deleteIfEmpty(dayId: string, userId: string): Promise<boolean> {
    const result = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*) AS count FROM entries WHERE day_id = ? AND user_id = ?`,
      [dayId, userId],
    );

    if (Number(result[0]?.count ?? 0) > 0) {
      return false;
    }

    const deleted = await this.days.delete({ id: dayId, userId });

    return deleted.affected === 1;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    /UNIQUE constraint failed/i.test(error.message)
  );
}
