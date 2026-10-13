import { IsString, ValidateIf } from 'class-validator';
import { ContainsAtLeastOneField } from '../../shared/decorators/contains-at-least-one-field.decorator';
import { ContainsNonWhitespace } from '../../shared/decorators/contains-non-whitespace.decorator';

@ContainsAtLeastOneField()
export class UpdateEntryDto {
  @ValidateIf((dto: UpdateEntryDto) => dto.content !== undefined)
  @IsString()
  @ContainsNonWhitespace()
  content?: string;
}
