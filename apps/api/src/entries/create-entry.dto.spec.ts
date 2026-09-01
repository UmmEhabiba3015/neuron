import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateEntryDto } from './create-entry.dto';

// What this file proves and what it deliberately does not.
//
// It proves the *rules* on `CreateEntryDto` are the right rules, by running
// `class-validator` against them directly. It cannot prove that anything calls
// them — a DTO whose class is never named in a controller signature would pass
// every test below. That second claim needs the real application, and it lives
// in `test/app.e2e-spec.ts`, which goes red the moment the pipe is unhooked
// from `AppModule`.
//
// This is the same split Day 6 arrived at: `env.validation.spec.ts` proves the
// rules, `config-wiring.e2e-spec.ts` proves they are connected (ADR-007).
//
// Note also what is *not* tested here: rejecting an unrecognised field. That
// comes from `forbidNonWhitelisted`, which is an option on the pipe rather than
// a rule on this class, so asserting it here would mean repeating the pipe's
// configuration in a test — the drift ADR-008 registers the pipe in
// `AppModule` to avoid. It is tested end-to-end instead.

// The messages, not merely the fact that something failed. A bare "it was
// rejected" assertion is satisfied by the wrong rule firing, and this project
// has a written case of a broken search passing its test for exactly that
// reason.
const messagesFor = (body: unknown): string[] =>
  validateSync(plainToInstance(CreateEntryDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('CreateEntryDto', () => {
  it('should accept a body carrying only content', () => {
    expect(messagesFor({ content: 'an ordinary entry' })).toEqual([]);
  });

  // Whitespace decides validity; it never edits the value. Surrounding spaces
  // are the user's choice and the entry is valid (ADR-005).
  it('should accept content padded with whitespace', () => {
    expect(messagesFor({ content: '  the spacing I chose  ' })).toEqual([]);
  });

  it('should reject a missing content field', () => {
    expect(messagesFor({})).toEqual(['content must be a string']);
  });

  // SQLite's TEXT affinity would coerce 42 into "42" on the way in, so the POST
  // response and every later GET would disagree about the type of the same
  // entry's content (ADR-005).
  it('should reject content that is not a string', () => {
    expect(messagesFor({ content: 42 })).toEqual(['content must be a string']);
  });

  // Exactly one message, and that is the claim. `@Matches(/\S/)` was rejected
  // as the implementation of the non-whitespace rule partly because it fires
  // alongside the string error, answering a single mistake with two sentences
  // of which one is noise. This test fails if the custom decorator is ever
  // rewritten to check non-strings (ADR-008, Decision 4).
  it('should answer a non-string with one message and not two', () => {
    expect(messagesFor({ content: 42 })).toHaveLength(1);
  });

  // `null` and a missing field answer the same way here, because nothing on
  // this class is optional. The claim is worth stating anyway: it is the case
  // that goes wrong on `UpdateEntryDto`, where `content` *is* optional.
  it('should reject content that is null', () => {
    expect(messagesFor({ content: null })).toEqual([
      'content must be a string',
    ]);
  });

  it('should reject empty content', () => {
    expect(messagesFor({ content: '' })).toEqual([
      'content must contain at least one character that is not whitespace',
    ]);
  });

  // The case `@IsNotEmpty()` accepts, which is why it is not used. An entry of
  // three spaces can never be read, searched, or summarised.
  it('should reject content that is only whitespace', () => {
    expect(messagesFor({ content: '   ' })).toEqual([
      'content must contain at least one character that is not whitespace',
    ]);
  });

  // Tabs and newlines are whitespace too. `@Matches(/\S/)` and a `.trim()`
  // check agree here, but a hand-written `value !== ' '` would not.
  it('should reject content that is only tabs and newlines', () => {
    expect(messagesFor({ content: '\t\n  \r' })).toEqual([
      'content must contain at least one character that is not whitespace',
    ]);
  });

  // The message has to name the field. A sender who mistyped needs to know
  // which value was wrong, which is the whole reason the rule was not written
  // as `@Matches(/\S/)` — its message names a regular expression instead.
  it('should name the field in every message it produces', () => {
    for (const body of [{}, { content: 42 }, { content: '   ' }]) {
      for (const message of messagesFor(body)) {
        expect(message).toContain('content');
      }
    }
  });
});
