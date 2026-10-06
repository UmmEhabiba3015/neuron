import { Injectable } from '@nestjs/common';
import { dayFor } from './day-boundary';
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
   */
  async resolveFor(userId: string, instant: string): Promise<Day> {
    return this.daysRepository.findOrCreate(userId, dayFor(instant));
  }

  findByDate(userId: string, date: string): Promise<Day | undefined> {
    return this.daysRepository.findByDate(userId, date);
  }

  /*
   * Which date "today" is, decided here rather than in a browser. The 4am
   * boundary lives on this side, and so will the user's timezone when there
   * is one, so a client that worked the date out for itself would be writing
   * the rule a second time and getting it wrong the day the rule changes.
   *
   * Reading a day does not create it. An empty day does not exist.
   */
  async findToday(
    userId: string,
  ): Promise<{ date: string; day: Day | undefined }> {
    const date = dayFor(new Date());

    return { date, day: await this.daysRepository.findByDate(userId, date) };
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

  /*
   * "An empty day does not exist" -- 00-flow.md section 0. A day whose last
   * item is deleted stops being a day, or the calendar grows marks for days
   * with nothing in them.
   */
  discardIfEmpty(dayId: string, userId: string): Promise<boolean> {
    return this.daysRepository.deleteIfEmpty(dayId, userId);
  }
}
