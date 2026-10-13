import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DayDateParamDto } from './day-date-param.dto';

const messagesFor = (params: unknown): string[] =>
  validateSync(plainToInstance(DayDateParamDto, params)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('DayDateParamDto', () => {
  it('accepts a real date, past or future', () => {
    expect(messagesFor({ date: '2026-08-09' })).toEqual([]);
    expect(messagesFor({ date: '2031-01-01' })).toEqual([]);
  });

  /*
   * Whether a date is in the future is decided after this, by the
   * controller, so a future date that is not a date is still a 400.
   */
  it.each([
    ['a day that rolls over', '2026-02-31'],
    ['a future day that rolls over', '2031-02-31'],
    ['a month that does not exist', '2026-13-01'],
    ['a word', 'not-a-date'],
    ['the day first', '31-01-2031'],
  ])('refuses %s', (_label, date) => {
    expect(messagesFor({ date })).toEqual([
      'date must be a real calendar date in YYYY-MM-DD form',
    ]);
  });
});
