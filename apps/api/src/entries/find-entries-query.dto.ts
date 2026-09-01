import { IsString, ValidateIf } from 'class-validator';

// What a client may put in the query string of `GET /entries`.
//
// A query string is input that arrived over the network, exactly like a request
// body, and until Day 7 it was the only input the application inspected by
// hand. Giving it a DTO is what puts it behind the same pipe as the two bodies,
// and it carries two rules that used to live in `parseSearchTerm` and in
// nothing at all respectively (ADR-008, Decisions 6 and 7).
export class FindEntriesQueryDto {
  // Searching is optional: `GET /entries` with no query string lists
  // everything, so the rule below is skipped when `word` was not sent.
  //
  // `@ValidateIf` rather than `@IsOptional()`, which would do the same job
  // here — a query string cannot deliver `null`, only a string or an array of
  // them. It is written this way so that one idiom means "optional" across
  // every DTO in this folder, because in `update-entry.dto.ts` the two are not
  // interchangeable and the difference there is a 500.
  @ValidateIf((query: FindEntriesQueryDto) => query.word !== undefined)
  // A URL may legally repeat a parameter, and when it does Express hands over
  // an **array** — so `?word=a&word=b` arrives as `["a","b"]`. The old
  // signature said `string`, the compiler believed it, and `%${word}%` searched
  // for the text `a,b`, answering "I found nothing" to a question it had never
  // managed to read. This rule is what makes that a 400 instead (ADR-006).
  @IsString()
  // Note what is *not* here: nothing rejects `""`. A `word` that is present but
  // empty is a well-formed request — it is a search for nothing, and it finds
  // nothing. That is a different message from no `word` at all, which means "I
  // am not searching, show me everything". The controller reads the difference
  // by asking whether the field is defined, never whether it is truthy.
  word?: string;
}
