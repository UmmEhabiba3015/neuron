import { EntryKind } from '@neuron/contracts';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CountEntriesQueryDto } from './count-entries-query.dto';

const messagesFor = (query: unknown): string[] =>
  validateSync(plainToInstance(CountEntriesQueryDto, query)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

/*
 * The count takes the same filters as the listing and must refuse the same
 * values, or a bad filter would be ignored here and counted as everything.
 */
describe('CountEntriesQueryDto', () => {
  it('accepts no filter, a word, an empty word and a real date', () => {
    expect(messagesFor({})).toEqual([]);
    expect(messagesFor({ word: 'sister' })).toEqual([]);
    expect(messagesFor({ word: '' })).toEqual([]);
    expect(messagesFor({ date: '2026-08-09', word: 'flat' })).toEqual([]);
  });

  it('refuses a word given more than once', () => {
    expect(messagesFor({ word: ['a', 'b'] })).toEqual([
      'word must be a string',
    ]);
  });

  it.each([
    ['a month that does not exist', '2026-13-45'],
    ['a day that does not exist', '2026-02-31'],
    ['a word', 'yesterday'],
    ['an instant', '2026-08-09T10:00:00.000Z'],
    ['an empty date', ''],
    ['a date given twice', ['2026-08-09', '2026-08-10']],
  ])('refuses %s', (_label, date) => {
    expect(messagesFor({ date })).toEqual([
      'date must be a real calendar date in YYYY-MM-DD form',
    ]);
  });
});

describe('the kind filter', () => {
  it('accepts each kind the contract names', () => {
    for (const kind of Object.values(EntryKind)) {
      expect(messagesFor({ kind })).toEqual([]);
    }
  });

  it.each([
    ['a kind that does not exist', 'Song'],
    ['a kind in other capitals', 'voice'],
    ['an empty kind', ''],
    ['a kind given twice', ['Text', 'Voice']],
  ])('refuses %s', (_label, kind) => {
    expect(messagesFor({ kind })).toEqual([
      'kind must be one of the following values: Text, Voice',
    ]);
  });
});
