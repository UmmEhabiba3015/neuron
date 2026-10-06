import { MOODS, type Mood } from '@neuron/contracts';
import { IsIn, ValidateIf } from 'class-validator';

/*
 * Five words, or null to clear it.
 *
 * The brief is explicit that mood is "one tap, five states, no numeric
 * scale", because "numbers invite false precision about a feeling". The
 * enum is the whole validation: anything else is a 400.
 *
 * null is a real value here rather than an absent one, so ValidateIf lets it
 * through and IsIn rejects everything that is neither null nor a known word.
 */
export class SetMoodDto {
  @ValidateIf((dto: SetMoodDto) => dto.mood !== null)
  @IsIn(MOODS, {
    message: `mood must be null or one of: ${MOODS.join(', ')}`,
  })
  mood!: Mood | null;
}
