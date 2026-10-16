import type { CreateVoiceMemo } from '@neuron/contracts';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_DURATION_MS } from '../voice-memo-rules';

/*
 * The text fields of POST /entries/voice. A multipart form sends every field
 * as text, so durationMs is turned into a number before it is checked: "90"
 * becomes 90, and "abc", "1.5" and "" are refused.
 */
export class CreateVoiceMemoDto implements CreateVoiceMemo {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_DURATION_MS)
  durationMs!: number;
}
