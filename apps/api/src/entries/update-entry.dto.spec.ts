import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateEntryDto } from './update-entry.dto';

// The rules on `UpdateEntryDto`, run directly. As in
// `create-entry.dto.spec.ts`, this proves the rules are right and cannot prove
// anything calls them; `test/app.e2e-spec.ts` is what proves the connection.
const messagesFor = (body: unknown): string[] =>
  validateSync(plainToInstance(UpdateEntryDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

const EMPTY_BODY_MESSAGE =
  'the request body must contain at least one field to update';
const WHITESPACE_MESSAGE =
  'content must contain at least one character that is not whitespace';

describe('UpdateEntryDto', () => {
  it('should accept a body carrying content', () => {
    expect(messagesFor({ content: 'the second draft' })).toEqual([]);
  });

  it('should accept content padded with whitespace', () => {
    expect(messagesFor({ content: '  the spacing I chose  ' })).toEqual([]);
  });

  // The rule `@IsOptional()` cannot express on its own: with every field
  // optional there is nothing in `{}` for a per-property decorator to object
  // to, so the check has to belong to the class (ADR-008, Decision 5).
  it('should reject an empty body', () => {
    expect(messagesFor({})).toEqual([EMPTY_BODY_MESSAGE]);
  });

  // The message has to say what to do about it. "Invalid body" would be true
  // and useless; a sender who receives this knows the request was understood
  // and simply carried nothing to act on.
  it('should tell an empty-body sender what the body needs', () => {
    expect(messagesFor({})[0]).toContain('at least one field');
  });

  // Explicit `undefined` is not a field that arrived. JSON cannot express it,
  // but `plainToInstance` produces exactly this shape for a declared property
  // that was not sent — so this pins the reason the class-level rule counts
  // values rather than keys.
  it('should treat a content field of undefined as no field at all', () => {
    expect(messagesFor({ content: undefined })).toEqual([EMPTY_BODY_MESSAGE]);
  });

  // The one collision the class-level rule has to close by hand. `class-validator`
  // has no class-level registration, so the rule is registered against no
  // property — and a client sending a field named literally `undefined` would
  // otherwise look, to `forbidNonWhitelisted`, like it had named a property the
  // server recognises. Without the guard in the decorator this body reaches the
  // service with no content and fails as a 500.
  it('should reject a field named literally undefined', () => {
    expect(messagesFor({ undefined: 'x' })).toEqual([EMPTY_BODY_MESSAGE]);
    expect(messagesFor({ undefined: 'x', content: 'real text' })).toEqual([
      EMPTY_BODY_MESSAGE,
    ]);
  });

  // `null` is not an absent field, and this is the claim that separates
  // `@ValidateIf` from `@IsOptional()`. Under `@IsOptional()` this body passes
  // every rule here and reaches a `NOT NULL` column as a 500. `undefined` means
  // "I am not changing this field"; `null` is a value the client chose to send,
  // and it is not a string.
  it('should reject a content field of null', () => {
    expect(messagesFor({ content: null })).toEqual([
      'content must be a string',
    ]);
  });

  // The same three content rules as `CreateEntryDto`. They are written twice
  // rather than inherited, so they are asserted twice — two declarations can
  // drift, and a shared test would not notice.
  it('should reject content that is not a string', () => {
    expect(messagesFor({ content: 42 })).toEqual(['content must be a string']);
  });

  it('should reject empty content', () => {
    expect(messagesFor({ content: '' })).toEqual([WHITESPACE_MESSAGE]);
  });

  it('should reject content that is only whitespace', () => {
    expect(messagesFor({ content: '   ' })).toEqual([WHITESPACE_MESSAGE]);
  });

  // An empty string is a field that arrived, so the empty-body rule must stay
  // silent and let the content rule answer. Two messages here would mean the
  // class-level check is confusing "absent" with "falsy" — the same mistake
  // this day removed from the search parameter.
  it('should answer empty content with the content rule alone', () => {
    expect(messagesFor({ content: '' })).not.toContain(EMPTY_BODY_MESSAGE);
  });
});
