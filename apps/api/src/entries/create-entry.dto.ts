import type { WireNewEntry } from '@neuron/contracts';
import { IsString } from 'class-validator';
import { ContainsNonWhitespace } from './contains-non-whitespace.decorator';

export class CreateEntryDto implements WireNewEntry {
  @IsString()
  @ContainsNonWhitespace()
  content: string;
}
