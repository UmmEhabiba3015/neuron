import { IsString, ValidateIf } from 'class-validator';

export class FindEntriesQueryDto {
  // `@ValidateIf` rather than `@IsOptional()` only so that one idiom means
  // "optional" across every DTO here; in update-entry.dto.ts the two are not
  // interchangeable.
  @ValidateIf((query: FindEntriesQueryDto) => query.word !== undefined)
  // A URL may repeat a parameter, and Express then hands over an array, so
  // `?word=a&word=b` arrives as `["a","b"]`. This rule makes that a 400 rather
  // than a search for the text `a,b` (ADR-006).
  @IsString()
  // Nothing rejects `""` on purpose: a present-but-empty word is a search for
  // nothing, which is a different message from no word at all.
  word?: string;
}
