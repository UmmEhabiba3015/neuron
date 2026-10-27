import {
  DEFAULT_PORT,
  loadMigrationEnvironment,
  validate,
} from './env.validation';

const LOCAL_DATABASE_URL = 'postgres://neuron:neuron@localhost:5432/neuron';

const withRequired = (config: Record<string, unknown> = {}) => ({
  JWT_SECRET: 'a-valid-test-secret-of-more-than-32-characters',
  WEB_ORIGIN: 'http://localhost:3001',
  DATABASE_URL: LOCAL_DATABASE_URL,
  ...config,
});

describe('validate', () => {
  describe('PORT', () => {
    it('should default to 3000 when PORT is not set', () => {
      expect(validate(withRequired()).PORT).toBe(DEFAULT_PORT);
    });

    it.each([
      ['the lowest legal port', '1', 1],
      ['the default written out', '3000', 3000],
      ['an ordinary choice', '4242', 4242],
      ['the highest legal port', '65535', 65535],
    ])(
      'should accept %s and return it as a number',
      (_label, raw, expected) => {
        const port = validate(withRequired({ PORT: raw })).PORT;

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
      expect(() => validate(withRequired({ PORT: raw }))).toThrow(
        /^PORT must be/,
      );
    });

    it('should name the variable and quote the value it rejected', () => {
      expect(() => validate(withRequired({ PORT: 'hello' }))).toThrow(
        'PORT must be a whole number between 1 and 65535, received "hello"',
      );
    });

    it('should quote the value so that invisible characters stay visible', () => {
      expect(() => validate(withRequired({ PORT: ' 3000 ' }))).toThrow(
        'PORT must be a whole number between 1 and 65535, received " 3000 "',
      );
    });
  });

  describe('DATABASE_URL', () => {
    it.each([
      ['not set', undefined],
      ['the empty string', ''],
    ])(
      'should refuse to boot when it is %s, naming the variable',
      (_l, raw) => {
        expect(() => validate(withRequired({ DATABASE_URL: raw }))).toThrow(
          /^DATABASE_URL must be set\..*docker compose up -d/s,
        );
      },
    );

    it.each([
      ['the local database', LOCAL_DATABASE_URL],
      ['the postgresql: spelling', 'postgresql://u:p@db.example.com:6543/x'],
    ])('should pass %s through unchanged', (_label, raw) => {
      expect(validate(withRequired({ DATABASE_URL: raw })).DATABASE_URL).toBe(
        raw,
      );
    });

    it.each([
      ['a SQLite file path', 'data/neuron.db'],
      ['another kind of database', 'mysql://u:p@localhost:3306/neuron'],
      ['an address with no database named', 'postgres://u:p@localhost:5432'],
      ['an address with no host', 'postgres:///neuron'],
      ['surrounding whitespace', ` ${LOCAL_DATABASE_URL} `],
    ])('should refuse to boot for %s', (_label, raw) => {
      expect(() => validate(withRequired({ DATABASE_URL: raw }))).toThrow(
        /^DATABASE_URL must be a Postgres address/,
      );
    });

    it('should quote the value it rejected with the password hidden', () => {
      const attempt = () =>
        validate(
          withRequired({
            DATABASE_URL: 'mysql://neuron:hunter2-secret@localhost:3306/x',
          }),
        );

      expect(attempt).toThrow('received "mysql://neuron:***@localhost:3306/x"');
      expect(attempt).not.toThrow(/hunter2-secret/);
    });
  });

  describe('AUDIO_PATH', () => {
    it('should refuse to boot for the empty string, naming the variable', () => {
      expect(() => validate(withRequired({ AUDIO_PATH: '' }))).toThrow(
        'AUDIO_PATH must be a non-empty path, received ""',
      );
    });

    it('should pass an explicit path through unchanged', () => {
      expect(
        validate(withRequired({ AUDIO_PATH: 'data/audio' })).AUDIO_PATH,
      ).toBe('data/audio');
    });

    it('should leave the key out entirely when AUDIO_PATH is not set', () => {
      expect('AUDIO_PATH' in validate(withRequired())).toBe(false);
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

      expect(validate(withRequired({ JWT_SECRET: secret })).JWT_SECRET).toBe(
        secret,
      );
    });
  });

  describe('WEB_ORIGIN', () => {
    it('should refuse to boot when WEB_ORIGIN is not set, with no default', () => {
      expect(() => validate(withRequired({ WEB_ORIGIN: undefined }))).toThrow(
        /^WEB_ORIGIN must be set/,
      );
    });

    it('should refuse to boot for the empty string', () => {
      expect(() => validate(withRequired({ WEB_ORIGIN: '' }))).toThrow(
        /^WEB_ORIGIN must be set/,
      );
    });

    it.each([
      ['a local origin with a port', 'http://localhost:3001'],
      ['an origin with no port', 'https://neuron.example'],
      ['an address with a port', 'http://127.0.0.1:8080'],
    ])('should pass %s through unchanged', (_label, origin) => {
      expect(validate(withRequired({ WEB_ORIGIN: origin })).WEB_ORIGIN).toBe(
        origin,
      );
    });

    it.each([
      ['a trailing slash', 'http://localhost:3001/'],
      ['no scheme', 'localhost:3001'],
      ['the wildcard', '*'],
      ['a path', 'http://localhost:3001/app'],
      ['a query string', 'http://localhost:3001?x=1'],
      ['surrounding whitespace', ' http://localhost:3001 '],
      ['a scheme a browser page is never served from', 'ftp://localhost:3001'],
      ['a list of two origins', 'http://localhost:3001,http://localhost:3002'],
      ['a host in upper case, which no browser sends', 'http://LOCALHOST:3001'],
      ['a port the browser would leave out', 'http://localhost:80'],
      ['a credential in the address', 'http://user@localhost:3001'],
      ['the literal word null', 'null'],
    ])('should refuse to boot for %s', (_label, raw) => {
      expect(() => validate(withRequired({ WEB_ORIGIN: raw }))).toThrow(
        /^WEB_ORIGIN must be an origin/,
      );
    });

    it('should name the variable and quote the value it rejected', () => {
      expect(() =>
        validate(withRequired({ WEB_ORIGIN: 'http://localhost:3001/' })),
      ).toThrow('received "http://localhost:3001/"');
    });

    it('should quote the value so that invisible characters stay visible', () => {
      expect(() =>
        validate(withRequired({ WEB_ORIGIN: ' http://localhost:3001 ' })),
      ).toThrow('received " http://localhost:3001 "');
    });
  });

  it('should return only the variables it checks', () => {
    const validated = validate(
      withRequired({
        PORT: '3000',
        HOME: '/home/somebody',
        AWS_SECRET_ACCESS_KEY: 'not ours to carry around',
      }),
    );

    expect(Object.keys(validated)).toEqual([
      'PORT',
      'JWT_SECRET',
      'WEB_ORIGIN',
      'DATABASE_URL',
    ]);
  });

  describe('loadMigrationEnvironment', () => {
    const environmentBeforeThisTest = { ...process.env };

    afterEach(() => {
      process.env = { ...environmentBeforeThisTest };
    });

    it('should not require JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      process.env.DATABASE_URL = LOCAL_DATABASE_URL;

      expect(loadMigrationEnvironment()).toEqual({
        DATABASE_URL: LOCAL_DATABASE_URL,
      });
    });

    it('should refuse to run without DATABASE_URL, as the application does', () => {
      delete process.env.DATABASE_URL;

      expect(() => loadMigrationEnvironment()).toThrow(
        /^DATABASE_URL must be set/,
      );
    });

    it('should refuse an address that is not Postgres', () => {
      process.env.DATABASE_URL = 'data/neuron.db';

      expect(() => loadMigrationEnvironment()).toThrow(
        /^DATABASE_URL must be a Postgres address/,
      );
    });
  });
});
