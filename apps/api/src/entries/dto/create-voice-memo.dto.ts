import type { CreateVoiceMemo } from '@neuron/contracts';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, Max, Min, ValidateIf } from 'class-validator';
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

  /*
   * Exactly "true" or "false", turned into the boolean; anything else is
   * left as it came and refused. @Type(() => Boolean) is not used, because
   * it turns every non-empty text into true, "false" included. Missing
   * means in memory.
   */
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @Transform(
    ({ value }: { value: unknown }) => FORM_BOOLEANS.get(value) ?? value,
  )
  @IsBoolean()
  keptOutOfMemory?: boolean;
}

const FORM_BOOLEANS = new Map<unknown, boolean>([
  ['true', true],
  ['false', false],
]);
