import type { CreateEntry } from '@neuron/contracts';
import { IsString } from 'class-validator';
import { ContainsNonWhitespace } from '../../shared/decorators/contains-non-whitespace.decorator';

export class CreateEntryDto implements CreateEntry {
  @IsString()
  @ContainsNonWhitespace()
  content!: string;
}
