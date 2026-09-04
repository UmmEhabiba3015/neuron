import { IsString, ValidateIf } from 'class-validator';
import { ContainsAtLeastOneField } from './contains-at-least-one-field.decorator';
import { ContainsNonWhitespace } from './contains-non-whitespace.decorator';

// Structurally identical to CreateEntryDto today, and named separately anyway:
// a type at a boundary should say which boundary it describes (ADR-005).
@ContainsAtLeastOneField()
export class UpdateEntryDto {
  // `@ValidateIf`, not `@IsOptional()`, and the difference is a 500:
  // `@IsOptional()` treats `null` as absent, so `{"content": null}` would pass
  // every check and reach a NOT NULL column.
  @ValidateIf((dto: UpdateEntryDto) => dto.content !== undefined)
  @IsString()
  @ContainsNonWhitespace()
  content?: string;
}
