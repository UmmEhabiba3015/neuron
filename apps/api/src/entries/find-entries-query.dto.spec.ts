import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FindEntriesQueryDto } from './find-entries-query.dto';

// The values below are what Express actually hands a controller for each URL,
// which is the only reason this file can test a query string without a server.
// `?word=a&word=b` really does arrive as an array; that is not a hypothetical.
const messagesFor = (query: unknown): string[] =>
  validateSync(plainToInstance(FindEntriesQueryDto, query)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('FindEntriesQueryDto', () => {
  // `GET /entries` — no search requested.
  it('should accept an absent word', () => {
    expect(messagesFor({})).toEqual([]);
  });

  // `GET /entries?word=sister`
  it('should accept a single word', () => {
    expect(messagesFor({ word: 'sister' })).toEqual([]);
  });

  // `GET /entries?word=` — a search for nothing is a well-formed request. What
  // it *finds* is a separate question, answered in `entries.service.spec.ts`
  // and over HTTP in `test/app.e2e-spec.ts`.
  it('should accept an empty word', () => {
    expect(messagesFor({ word: '' })).toEqual([]);
  });

  // `GET /entries?word=a&word=b`. Taking `word[0]` would pick one of the two
  // terms the user asked for and silently discard the other, so the request is
  // refused instead of guessed at (ADR-006).
  it('should reject a word given more than once', () => {
    expect(messagesFor({ word: ['a', 'b'] })).toEqual([
      'word must be a string',
    ]);
  });

  // `GET /entries?word[x]=y`. Express's query parser builds nested objects
  // from bracket notation, so this is reachable from a plain URL.
  it('should reject a word that arrives as an object', () => {
    expect(messagesFor({ word: { x: 'y' } })).toEqual([
      'word must be a string',
    ]);
  });

  // `?word=100%` — a percent sign is ordinary text to this layer. The pattern
  // language `LIKE` reads it as belongs to the repository and stops there
  // (ADR-006).
  it('should accept a word containing characters LIKE treats specially', () => {
    expect(messagesFor({ word: '100%' })).toEqual([]);
    expect(messagesFor({ word: 'snake_case' })).toEqual([]);
  });
});
