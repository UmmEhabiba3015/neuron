import type { Day, Mood } from '@neuron/contracts';
import type { DayEntity } from '../entities/day.entity';

/*
 * A day as the API sends it. The entity also carries user_id, which is
 * select:false and never leaves the server, so the answer is built field by
 * field rather than being whatever the entity holds.
 *
 * A day with no row yet is answered too, from its date and no mood, so the
 * constructor takes the two fields rather than a whole entity.
 */
export class DayResponseDto implements Day {
  date: string;
  mood: Mood | null;

  constructor(day: Pick<DayEntity, 'date' | 'mood'>) {
    this.date = day.date;
    this.mood = day.mood;
  }
}
