import { dayFor } from './day-boundary';

describe('dayFor', () => {
  it('puts an ordinary daytime instant on its own date', () => {
    expect(dayFor('2026-08-09T14:05:00.000Z')).toBe('2026-08-09');
  });

  it('puts an instant after midnight on the previous day', () => {
    expect(dayFor('2026-08-09T01:30:00.000Z')).toBe('2026-08-08');
  });

  it('puts 03:59 on the previous day', () => {
    expect(dayFor('2026-08-09T03:59:59.999Z')).toBe('2026-08-08');
  });

  it('puts 04:00 exactly on the current day', () => {
    expect(dayFor('2026-08-09T04:00:00.000Z')).toBe('2026-08-09');
  });

  it('puts 04:01 on the current day', () => {
    expect(dayFor('2026-08-09T04:01:00.000Z')).toBe('2026-08-09');
  });

  it('puts 23:59 on the current day', () => {
    expect(dayFor('2026-08-09T23:59:59.999Z')).toBe('2026-08-09');
  });

  it('crosses a month boundary backwards', () => {
    expect(dayFor('2026-08-01T02:00:00.000Z')).toBe('2026-07-31');
  });

  it('crosses a year boundary backwards', () => {
    expect(dayFor('2026-01-01T03:00:00.000Z')).toBe('2025-12-31');
  });

  it('handles a leap day', () => {
    expect(dayFor('2024-03-01T01:00:00.000Z')).toBe('2024-02-29');
  });

  it('accepts a Date as well as a string', () => {
    expect(dayFor(new Date('2026-08-09T01:30:00.000Z'))).toBe('2026-08-08');
  });

  it('refuses an instant it cannot read', () => {
    expect(() => dayFor('not a date')).toThrow(TypeError);
  });
});
