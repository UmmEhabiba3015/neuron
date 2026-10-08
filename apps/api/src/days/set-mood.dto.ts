import { MOODS, type Mood, type WireMood } from '@neuron/contracts';
import { IsIn, ValidateIf } from 'class-validator';

/*
 * null is a real value here rather than an absent one, so ValidateIf lets it
 * through and IsIn rejects everything that is neither null nor a known word.
 */
export class SetMoodDto implements WireMood {
  @ValidateIf((dto: SetMoodDto) => dto.mood !== null)
  @IsIn(MOODS, {
    message: `mood must be null or one of: ${MOODS.join(', ')}`,
  })
  mood!: Mood | null;
}
