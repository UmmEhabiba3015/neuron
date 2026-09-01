import { IsString } from 'class-validator';
import { ContainsNonWhitespace } from './contains-non-whitespace.decorator';

// A DTO — Data Transfer Object — describes data *crossing a boundary*, which
// is a different question from what a thing *is*. `JournalEntry` answers the
// second: an entry has an id and a creation time, always. This answers the
// first: of those three fields, `content` is the only one a client is allowed
// to send, because the server generates the other two (ADR-004).
//
// This is a **class**, and was an interface until Day 7. The change is not
// cosmetic. An interface is erased at compile time, so it could only write the
// contract down while hand-written code in the controller held it up. A
// decorator needs a runtime object to attach to, so the rules below live on
// this class and the global `ValidationPipe` enforces them before any
// controller method runs (ADR-008).
//
// Anything not listed here is rejected rather than ignored, and that rule is
// not written in this file: `forbidNonWhitelisted` on the pipe in
// `app.module.ts` is what turns "no decorator" into `property id should not
// exist`. The absence of a field is as load-bearing as its presence.
export class CreateEntryDto {
  // Not redundant with the type above, because SQLite would not enforce it. A
  // `TEXT` column has type *affinity*, not a type constraint: handed the number
  // 42 it silently stores the string "42". The POST response would echo
  // `"content": 42` from the in-memory object while every later GET returned
  // `"content": "42"` from the row — one entry with two types depending on
  // which endpoint served it (ADR-005).
  @IsString()
  // `@IsString()` accepts `""` and `"   "`. An entry whose text is empty or
  // entirely whitespace can never be read, searched, or summarised, and no
  // library decorator rejects it — see the decorator's own file for the two
  // that were tried.
  @ContainsNonWhitespace()
  content: string;
}
