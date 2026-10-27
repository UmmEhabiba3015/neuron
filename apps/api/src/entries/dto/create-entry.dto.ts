import type { CreateEntry } from '@neuron/contracts';
import { IsString } from 'class-validator';
import { ContainsNoNulCharacter } from '../../shared/decorators/contains-no-nul-character.decorator';
import { ContainsNonWhitespace } from '../../shared/decorators/contains-non-whitespace.decorator';

export class CreateEntryDto implements CreateEntry {
  @IsString()
  @ContainsNonWhitespace()
  @ContainsNoNulCharacter()
  content!: string;
}
