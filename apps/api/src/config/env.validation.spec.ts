import {
  DEFAULT_PORT,
  loadMigrationEnvironment,
  validate,
} from './env.validation';

const withSecret = (config: Record<string, unknown> = {}) => ({
  JWT_SECRET: 'a-valid-test-secret-of-more-than-32-characters',
  ...config,
});

describe('validate', () => {
  describe('PORT', () => {
    it('should default to 3000 when PORT is not set', () => {
      expect(validate(withSecret()).PORT).toBe(DEFAULT_PORT);
    });

    it.each([
      ['the lowest legal port', '1', 1],
      ['the default written out', '3000', 3000],
      ['an ordinary choice', '4242', 4242],
      ['the highest legal port', '65535', 65535],
    ])(
      'should accept %s and return it as a number',
      (_label, raw, expected) => {
        const port = validate(withSecret({ PORT: raw })).PORT;

        expect(port).toBe(expected);
        expect(typeof port).toBe('number');
      },
    );

    it.each([
      ['the empty string', ''],
      ['zero, which Node reads as "any free port"', '0'],
      ['a negative number', '-5'],
      ['a number above the legal range', '99999'],
      ['text', 'hello'],
      ['a number with text stuck to it', '3000abc'],
      ['a number with surrounding whitespace', ' 3000 '],
    ])('should refuse to boot for %s', (_label, raw) => {
      expect(() => validate(withSecret({ PORT: raw }))).toThrow(
        /^PORT must be/,
      );
    });

    it('should name the variable and quote the value it rejected', () => {
      expect(() => validate(withSecret({ PORT: 'hello' }))).toThrow(
        'PORT must be a whole number between 1 and 65535, received "hello"',
      );
    });

    it('should quote the value so that invisible characters stay visible', () => {
      expect(() => validate(withSecret({ PORT: ' 3000 ' }))).toThrow(
        'PORT must be a whole number between 1 and 65535, received " 3000 "',
      );
    });
  });

  describe('DATABASE_PATH', () => {
    it('should refuse to boot for the empty string, naming the variable', () => {
      expect(() => validate(withSecret({ DATABASE_PATH: '' }))).toThrow(
        'DATABASE_PATH must be a non-empty path, received ""',
      );
    });

    it('should pass an explicit path through unchanged', () => {
      expect(
        validate(withSecret({ DATABASE_PATH: 'data/scratch.db' }))
          .DATABASE_PATH,
      ).toBe('data/scratch.db');
    });

    it('should not trim surrounding whitespace from a path', () => {
      const padded = '  data/scratch.db  ';

      expect(
        validate(withSecret({ DATABASE_PATH: padded })).DATABASE_PATH,
      ).toBe(padded);
    });

    it('should leave the key out entirely when DATABASE_PATH is not set', () => {
      expect('DATABASE_PATH' in validate(withSecret())).toBe(false);
    });
  });

  describe('JWT_SECRET', () => {
    it('should refuse to boot when JWT_SECRET is not set', () => {
      expect(() => validate({ PORT: '3000' })).toThrow(/^JWT_SECRET must be/);
    });

    it('should refuse to boot for the empty string', () => {
      expect(() => validate({ JWT_SECRET: '' })).toThrow(/^JWT_SECRET must be/);
    });

    it('should refuse a secret shorter than 32 characters', () => {
      expect(() => validate({ JWT_SECRET: 'secret' })).toThrow(
        /at least 32 characters/,
      );
    });

    it('should never print the secret it rejected', () => {
      const tooShort = 'abcdefgh';

      let message = '';
      try {
        validate({ JWT_SECRET: tooShort });
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toMatch(/^JWT_SECRET must be/);
      expect(message).not.toContain(tooShort);
    });

    it('should pass a long enough secret through unchanged', () => {
      const secret = 'a-valid-test-secret-of-more-than-32-characters';

      expect(validate({ JWT_SECRET: secret }).JWT_SECRET).toBe(secret);
    });
  });

  it('should return only the variables it checks', () => {
    const validated = validate(
      withSecret({
        PORT: '3000',
        DATABASE_PATH: 'data/scratch.db',
        HOME: '/home/somebody',
        AWS_SECRET_ACCESS_KEY: 'not ours to carry around',
      }),
    );

    expect(Object.keys(validated)).toEqual([
      'PORT',
      'JWT_SECRET',
      'DATABASE_PATH',
    ]);
  });

  describe('loadMigrationEnvironment', () => {
    const environmentBeforeThisTest = { ...process.env };

    afterEach(() => {
      process.env = { ...environmentBeforeThisTest };
    });

    it('should not require JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      process.env.DATABASE_PATH = 'data/scratch.db';

      expect(loadMigrationEnvironment()).toEqual({
        DATABASE_PATH: 'data/scratch.db',
      });
    });

    it('should still reject an empty DATABASE_PATH', () => {
      process.env.DATABASE_PATH = '';

      expect(() => loadMigrationEnvironment()).toThrow(
        /^DATABASE_PATH must be/,
      );
    });

    it('should leave the key out entirely when DATABASE_PATH is not set', () => {
      delete process.env.DATABASE_PATH;

      expect(loadMigrationEnvironment()).toEqual({});
    });
  });
});
