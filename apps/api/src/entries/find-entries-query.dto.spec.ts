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

  it('should accept an absent date and a real one', () => {
    expect(messagesFor({})).toEqual([]);
    expect(messagesFor({ date: '2026-08-09' })).toEqual([]);
  });

  it.each([
    ['an empty date', ''],
    ['a word', 'today'],
    ['an instant', '2026-08-09T04:00:00.000Z'],
    ['a month that does not exist', '2026-13-01'],
    ['a day that rolls over', '2026-02-31'],
    ['a date given twice', ['2026-08-09', '2026-08-10']],
  ])('should reject %s', (_label, date) => {
    expect(messagesFor({ date })).toEqual([
      'date must be a real calendar date in YYYY-MM-DD form',
    ]);
  });

  it('should accept a word containing characters LIKE treats specially', () => {
    expect(messagesFor({ word: '100%' })).toEqual([]);
    expect(messagesFor({ word: 'snake_case' })).toEqual([]);
  });
});
