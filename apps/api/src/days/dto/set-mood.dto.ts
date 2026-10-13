import { Mood, type SetMood } from '@neuron/contracts';
import { IsIn, ValidateIf } from 'class-validator';

/*
 * null is a real value here rather than an absent one, so ValidateIf lets it
 * through and IsIn rejects everything that is neither null nor a known word.
 */
export class SetMoodDto implements SetMood {
  @ValidateIf((dto: SetMoodDto) => dto.mood !== null)
  @IsIn(Object.values(Mood), {
    message: `mood must be null or one of: ${Object.values(Mood).join(', ')}`,
  })
  mood!: Mood | null;
}
