import { Injectable } from '@nestjs/common';
import { dayFor, type DayOwner } from './day-boundary';
import { DaysRepository } from './days.repository';
import type { Mood } from '@neuron/contracts';
import type { Day } from './day.entity';

@Injectable()
export class DaysService {
  constructor(private readonly daysRepository: DaysRepository) {}

  /*
   * The day an instant belongs to, resolved once, at write time. The server
   * decides this rather than the client: a client-supplied date would let a
   * caller file an entry under any day it liked, which is the same category
   * of mistake ADR-013 refused for ownership.
   *
   * The owner is the user the guard loaded for this request, so the timezone
   * costs no query.
   */
  async resolveFor(owner: DayOwner, instant: string): Promise<Day> {
    return this.daysRepository.findOrCreate(
      owner.id,
      dayFor(instant, owner.timezone),
    );
  }

  findByDate(userId: string, date: string): Promise<Day | undefined> {
    return this.daysRepository.findByDate(userId, date);
  }

  /*
   * Which date "today" is, decided here rather than in a browser. The rule
   * and the user's timezone both live on this side, so a client that worked
   * the date out for itself would be writing the rule a second time, from a
   * timezone that may not be the stored one.
   *
   * Reading a day does not create it. An empty day does not exist.
   */
  async findToday(
    owner: DayOwner,
  ): Promise<{ date: string; day: Day | undefined }> {
    const date = dayFor(new Date(), owner.timezone);

    return { date, day: await this.daysRepository.findByDate(owner.id, date) };
  }

  findInRange(userId: string, from: string, to: string): Promise<Day[]> {
    return this.daysRepository.findInRange(userId, from, to);
  }

  setMood(
    userId: string,
    date: string,
    mood: Mood | null,
  ): Promise<Day | undefined> {
    return this.daysRepository.setMood(userId, date, mood);
  }
}
