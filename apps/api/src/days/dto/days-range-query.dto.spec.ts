import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DaysRangeQueryDto } from './days-range-query.dto';

const messagesFor = (query: unknown): string[] =>
  validateSync(plainToInstance(DaysRangeQueryDto, query)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('DaysRangeQueryDto', () => {
  it('accepts two real dates, including a range that ends in the future', () => {
    expect(messagesFor({ from: '2026-08-01', to: '2031-12-31' })).toEqual([]);
  });

  it('refuses ends that are not dates', () => {
    expect(messagesFor({ from: '2026-02-31', to: '2026-03-01' })).toEqual([
      'from must be a real calendar date in YYYY-MM-DD form',
    ]);
    expect(messagesFor({ from: 'nope', to: '2026-03-01' })).toEqual([
      'from must be a real calendar date in YYYY-MM-DD form',
    ]);
  });

  it('requires both ends', () => {
    expect(messagesFor({ from: '2026-08-01' })).toEqual([
      'to must be a real calendar date in YYYY-MM-DD form',
    ]);
  });
});
