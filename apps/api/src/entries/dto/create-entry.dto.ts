import type { CreateEntry } from '@neuron/contracts';
import { IsBoolean, IsString, ValidateIf } from 'class-validator';
import { ContainsNoNulCharacter } from '../../shared/decorators/contains-no-nul-character.decorator';
import { ContainsNonWhitespace } from '../../shared/decorators/contains-non-whitespace.decorator';

export class CreateEntryDto implements CreateEntry {
  @IsString()
  @ContainsNonWhitespace()
  @ContainsNoNulCharacter()
  content!: string;

  /* Missing means in memory; null is refused. A JSON body carries a real true or false. */
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @IsBoolean()
  keptOutOfMemory?: boolean;
}
