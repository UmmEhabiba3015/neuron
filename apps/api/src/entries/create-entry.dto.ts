import { IsString } from 'class-validator';
import { ContainsNonWhitespace } from './contains-non-whitespace.decorator';

export class CreateEntryDto {
  @IsString()
  @ContainsNonWhitespace()
  content: string;
}
