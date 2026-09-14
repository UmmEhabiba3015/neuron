import { IsString, ValidateIf } from 'class-validator';
import { ContainsAtLeastOneField } from './contains-at-least-one-field.decorator';
import { ContainsNonWhitespace } from './contains-non-whitespace.decorator';

@ContainsAtLeastOneField()
export class UpdateEntryDto {
  @ValidateIf((dto: UpdateEntryDto) => dto.content !== undefined)
  @IsString()
  @ContainsNonWhitespace()
  content?: string;
}
