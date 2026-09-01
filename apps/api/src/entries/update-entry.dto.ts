import { IsString, ValidateIf } from 'class-validator';
import { ContainsAtLeastOneField } from './contains-at-least-one-field.decorator';
import { ContainsNonWhitespace } from './contains-non-whitespace.decorator';

// What a client may send to `PATCH /entries/:id`. Structurally identical to
// `CreateEntryDto` today, and named separately anyway, for the reason ADR-005
// gave when it split `CreateEntryDto` off from `JournalEntry`: a type at a
// boundary should say which boundary it describes. Calling a PATCH body a
// `CreateEntryDto` would read as though updating an entry creates one.
//
// The two rules on `content` are the same two `CreateEntryDto` states, and
// they are written twice rather than shared, because that is what a DTO is
// for: a client reading this file learns what a PATCH body may contain without
// having to follow a chain of inheritance. The *sentence a sender receives* is
// shared, and that is the part that would have drifted — see
// `contains-non-whitespace.decorator.ts`.
@ContainsAtLeastOneField()
export class UpdateEntryDto {
  // Optional, unlike on `CreateEntryDto`, and this is what `PATCH` means: the
  // body carries the fields being changed, not the whole resource. The class
  // decorator above is what stops that from making `{}` acceptable.
  //
  // `@ValidateIf` and not `@IsOptional()`, and the difference is a 500. Both
  // skip the rules below when the field is absent, which is the behaviour
  // wanted here — that skipping is also why the empty-body rule could not be
  // written as one more decorator on this property. But `@IsOptional()` treats
  // `null` as absent too, so `{"content": null}` would pass every check and
  // reach a `NOT NULL` column. `undefined` means "I am not changing this
  // field"; `null` is a value the client chose to send, and it is not a string.
  //
  // Found by asking what happens to a case the day's verification list did not
  // name, rather than by a test going red — nothing was testing it.
  @ValidateIf((dto: UpdateEntryDto) => dto.content !== undefined)
  @IsString()
  @ContainsNonWhitespace()
  content?: string;
}
