import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FindEntriesQueryDto } from './find-entries-query.dto';

const messagesFor = (query: unknown): string[] =>
  validateSync(plainToInstance(FindEntriesQueryDto, query)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('FindEntriesQueryDto', () => {
  it('should accept an absent word', () => {
    expect(messagesFor({})).toEqual([]);
  });

  it('should accept a single word', () => {
    expect(messagesFor({ word: 'sister' })).toEqual([]);
  });

  it('should accept an empty word', () => {
    expect(messagesFor({ word: '' })).toEqual([]);
  });

  it('should reject a word given more than once', () => {
    expect(messagesFor({ word: ['a', 'b'] })).toEqual([
      'word must be a string',
    ]);
  });

  it('should reject a word that arrives as an object', () => {
    expect(messagesFor({ word: { x: 'y' } })).toEqual([
      'word must be a string',
    ]);
  });

  it('should accept a word containing characters LIKE treats specially', () => {
    expect(messagesFor({ word: '100%' })).toEqual([]);
    expect(messagesFor({ word: 'snake_case' })).toEqual([]);
  });
});
