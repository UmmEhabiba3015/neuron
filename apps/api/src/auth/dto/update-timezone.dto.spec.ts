import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateTimezoneDto } from './update-timezone.dto';

/*
 * The check is registration's (RegisterDto, whose test covers it case by
 * case). These show that changing the timezone uses the same check, both
 * halves of it: the name is kept as Intl spells it, and an offset or an
 * unknown zone is refused.
 */
const parse = (body: Record<string, unknown>) =>
  plainToInstance(UpdateTimezoneDto, body);

const messagesFor = (body: Record<string, unknown>): string[] =>
  validateSync(parse(body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

const TIMEZONE_MESSAGE =
  'timezone must be an IANA time zone name such as Asia/Karachi';

describe('UpdateTimezoneDto', () => {
  it.each([
    ['America/New_York', 'America/New_York'],
    ['asia/karachi', 'Asia/Karachi'],
  ])('accepts %s and keeps it as %s', (sent, kept) => {
    expect(messagesFor({ timezone: sent })).toEqual([]);
    expect(parse({ timezone: sent }).timezone).toBe(kept);
  });

  it.each([
    ['an offset', '+05:00'],
    ['a zone that does not exist', 'Mars/Olympus'],
    ['a number', 5],
  ])('refuses %s', (_label, timezone) => {
    expect(messagesFor({ timezone })).toEqual([TIMEZONE_MESSAGE]);
  });

  it('refuses a body with no timezone', () => {
    expect(messagesFor({})).toEqual([TIMEZONE_MESSAGE]);
  });
});
