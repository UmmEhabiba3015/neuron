import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto } from './register.dto';

/*
 * plainToInstance runs the @Transform steps, as the global pipe does before
 * it validates, so these see the trimmed name and the resolved timezone.
 */
const parse = (body: Record<string, unknown>) =>
  plainToInstance(RegisterDto, body);

const messagesFor = (body: Record<string, unknown>): string[] =>
  validateSync(parse(body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

const valid = {
  email: 'habiba@example.com',
  password: 'a-long-enough-password',
  name: 'Habiba',
  timezone: 'Asia/Karachi',
};

const without = (field: keyof typeof valid): Record<string, unknown> => {
  const body: Record<string, unknown> = { ...valid };
  delete body[field];

  return body;
};

const TIMEZONE_MESSAGE =
  'timezone must be an IANA time zone name such as Asia/Karachi';
const NAME_WHITESPACE_MESSAGE =
  'name must contain at least one character that is not whitespace';

describe('RegisterDto', () => {
  it('accepts a complete registration', () => {
    expect(messagesFor(valid)).toEqual([]);
  });

  describe('email', () => {
    it.each([
      ['only spaces', '   '],
      ['a bare name', 'umer'],
      ['nothing after the @', 'umer@'],
      ['nothing before the @', '@example.com'],
      ['a space instead of an @', 'umer example.com'],
    ])('refuses %s', (_label, email) => {
      expect(messagesFor({ ...valid, email })).toEqual([
        'email must be an email address',
      ]);
    });

    it('keeps the address exactly as it was typed', () => {
      expect(parse({ ...valid, email: 'Ummi@Example.com' }).email).toBe(
        'Ummi@Example.com',
      );
    });
  });

  describe('password', () => {
    /* The 8 is written out, so a changed contract number is noticed here. */
    it('refuses fewer than 8 characters, and says so', () => {
      expect(messagesFor({ ...valid, password: '1234567' })).toEqual([
        'password must be longer than or equal to 8 characters',
      ]);
      expect(messagesFor({ ...valid, password: '12345678' })).toEqual([]);
    });

    it('refuses a body with no password', () => {
      expect(messagesFor(without('password'))).toContain(
        'password must be a string',
      );
    });
  });

  describe('timezone', () => {
    /*
     * Intl accepts every one of these spellings. What is kept is the name
     * Intl answers with, so one zone is always stored one way.
     */
    it.each([
      ['Asia/Karachi', 'Asia/Karachi'],
      ['asia/karachi', 'Asia/Karachi'],
      ['EST', 'America/Panama'],
    ])('accepts %s and keeps it as %s', (sent, kept) => {
      expect(messagesFor({ ...valid, timezone: sent })).toEqual([]);
      expect(parse({ ...valid, timezone: sent }).timezone).toBe(kept);
    });

    it.each([
      ['an offset', '+05:00'],
      ['an offset without a colon', '-0500'],
      ['a zone that does not exist', 'Mars/Olympus'],
      ['an empty string', ''],
      ['a country', 'Pakistan'],
      ['a number', 5],
      ['null', null],
    ])('refuses %s', (_label, timezone) => {
      expect(messagesFor({ ...valid, timezone })).toEqual([TIMEZONE_MESSAGE]);
    });

    it('refuses a body with no timezone, and does not fall back to one', () => {
      expect(messagesFor(without('timezone'))).toEqual([TIMEZONE_MESSAGE]);
    });
  });

  describe('name', () => {
    it('is trimmed at both ends and keeps the spaces inside it', () => {
      expect(parse({ ...valid, name: '  Habiba  ' }).name).toBe('Habiba');
      expect(parse({ ...valid, name: ' Umm e  Habiba ' }).name).toBe(
        'Umm e  Habiba',
      );
    });

    it.each([
      ['only spaces', '   '],
      ['only a tab and a line break', '\t\n'],
      ['empty', ''],
    ])('refuses a name that is %s', (_label, name) => {
      expect(messagesFor({ ...valid, name })).toEqual([
        NAME_WHITESPACE_MESSAGE,
      ]);
    });

    /* The 60 is written out, so a changed contract number is noticed here. */
    it('accepts 60 characters and refuses 61', () => {
      expect(messagesFor({ ...valid, name: 'a'.repeat(60) })).toEqual([]);
      expect(messagesFor({ ...valid, name: 'a'.repeat(61) })).toEqual([
        'name must be shorter than or equal to 60 characters',
      ]);
    });

    it('counts the 60 after trimming, not before', () => {
      const padded = { ...valid, name: `  ${'a'.repeat(60)}  ` };

      expect(messagesFor(padded)).toEqual([]);
      expect(parse(padded).name).toBe('a'.repeat(60));
    });

    it('refuses a body with no name, and a name that is not a string', () => {
      expect(messagesFor(without('name'))).toContain('name must be a string');
      expect(messagesFor({ ...valid, name: 42 })).toContain(
        'name must be a string',
      );
    });
  });
});
