import { dayFor } from './day-boundary';

describe('dayFor', () => {
  describe('in UTC', () => {
    it('puts an ordinary daytime instant on its own date', () => {
      expect(dayFor('2026-08-09T14:05:00.000Z', 'UTC')).toBe('2026-08-09');
    });

    it('puts the small hours on the date they are in, not the one before', () => {
      expect(dayFor('2026-08-09T01:30:00.000Z', 'UTC')).toBe('2026-08-09');
      expect(dayFor('2026-08-09T03:59:59.999Z', 'UTC')).toBe('2026-08-09');
    });

    it('puts the last millisecond before midnight on the old date', () => {
      expect(dayFor('2026-08-09T23:59:59.999Z', 'UTC')).toBe('2026-08-09');
    });

    it('puts midnight exactly on the new date', () => {
      expect(dayFor('2026-08-10T00:00:00.000Z', 'UTC')).toBe('2026-08-10');
    });
  });

  /*
   * Karachi is five hours ahead of UTC all year, so its midnight is 19:00Z
   * on the date before.
   */
  describe('at midnight in a zone that is not UTC', () => {
    it.each([
      ['one second before', '2026-08-09T18:59:59.000Z', '2026-08-09'],
      ['exactly', '2026-08-09T19:00:00.000Z', '2026-08-10'],
      ['one second after', '2026-08-09T19:00:01.000Z', '2026-08-10'],
    ])('%s midnight in Karachi is %s, which is %s', (_label, instant, date) => {
      expect(dayFor(instant, 'Asia/Karachi')).toBe(date);
    });
  });

  it('gives one instant two dates in two zones', () => {
    const instant = '2026-10-08T05:00:00.000Z';

    expect(dayFor(instant, 'America/New_York')).toBe('2026-10-08');
    expect(dayFor(instant, 'America/Los_Angeles')).toBe('2026-10-07');
  });

  /*
   * London is on UTC in January and an hour ahead of it in July. A rule
   * that added a fixed number of hours would get one of these wrong.
   */
  describe('where the clocks change', () => {
    it('puts 23:30Z in July on the next date in London', () => {
      expect(dayFor('2026-07-15T23:30:00.000Z', 'Europe/London')).toBe(
        '2026-07-16',
      );
    });

    it('puts 23:30Z in January on the same date in London', () => {
      expect(dayFor('2026-01-15T23:30:00.000Z', 'Europe/London')).toBe(
        '2026-01-15',
      );
    });

    it('follows the change on the night it happens', () => {
      /* London goes from 01:00 to 02:00 on 29 March 2026. */
      expect(dayFor('2026-03-28T23:30:00.000Z', 'Europe/London')).toBe(
        '2026-03-28',
      );
      expect(dayFor('2026-03-29T23:30:00.000Z', 'Europe/London')).toBe(
        '2026-03-30',
      );
    });
  });

  it('crosses a month boundary', () => {
    expect(dayFor('2026-07-31T20:00:00.000Z', 'Asia/Karachi')).toBe(
      '2026-08-01',
    );
  });

  it('crosses a year boundary', () => {
    expect(dayFor('2025-12-31T20:00:00.000Z', 'Asia/Karachi')).toBe(
      '2026-01-01',
    );
    expect(dayFor('2026-01-01T03:00:00.000Z', 'America/New_York')).toBe(
      '2025-12-31',
    );
  });

  it('handles a leap day', () => {
    expect(dayFor('2024-02-28T20:00:00.000Z', 'Asia/Karachi')).toBe(
      '2024-02-29',
    );
    expect(dayFor('2024-03-01T01:00:00.000Z', 'America/New_York')).toBe(
      '2024-02-29',
    );
  });

  it('accepts a Date as well as a string', () => {
    expect(dayFor(new Date('2026-08-09T19:30:00.000Z'), 'Asia/Karachi')).toBe(
      '2026-08-10',
    );
  });

  it('refuses an instant it cannot read', () => {
    expect(() => dayFor('not a date', 'UTC')).toThrow(TypeError);
  });

  it('refuses a timezone that does not exist', () => {
    expect(() => dayFor('2026-08-09T12:00:00.000Z', 'Mars/Olympus')).toThrow(
      RangeError,
    );
  });
});
