import {
  DEFAULT_PORT,
  loadMigrationEnvironment,
  validate,
} from './env.validation';

// Day 9 made `JWT_SECRET` mandatory with no default, so `validate({})` now
// throws for a reason none of the tests below are about. This supplies a valid
// one and lets each test go on stating exactly one rule.
//
// A helper rather than a literal repeated ten times: when Day 11 adds another
// required variable, the tests about `PORT` should not all have to be edited
// again to keep saying what they already say.
const withSecret = (config: Record<string, unknown> = {}) => ({
  JWT_SECRET: 'a-valid-test-secret-of-more-than-32-characters',
  ...config,
});

// `validate` is what `ConfigModule.forRoot({ validate })` runs at startup, so
// "throws" and "the application refuses to boot" are the same claim: whatever
// escapes this function escapes `NestFactory.create` and the process exits
// non-zero. Calling it directly rather than booting a module is deliberate —
// the rules are ours, the wiring that runs them is @nestjs/config's, and these
// tests are about the rules.
describe('validate', () => {
  describe('PORT', () => {
    // Absent means "I have no opinion, choose for me", and is the one case
    // where a default is the right answer (ADR-007).
    it('should default to 3000 when PORT is not set', () => {
      expect(validate(withSecret()).PORT).toBe(DEFAULT_PORT);
    });

    // Returned as a number, not the string that came in. That is the whole
    // fix: `listen("3000")` and `listen(3000)` behave the same, but
    // `listen("hello")` opens a socket file while `listen(number)` cannot.
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

    // Every row here was demonstrated against a real Node HTTP server before
    // this check existed, and the pattern is backwards from intuition: the
    // values that already failed loudly are the ones that look like numbers,
    // because those get range-checked. The ones that look nothing like a number
    // stop being ports and become filesystem paths, and a path cannot be
    // invalid — so `hello`, `-5` and `3000abc` each started a healthy server
    // that nothing could reach, and left a socket file of that name behind
    // (ADR-007).
    it.each([
      ['the empty string', ''],
      ['zero, which Node reads as "any free port"', '0'],
      ['a negative number', '-5'],
      ['a number above the legal range', '99999'],
      ['text', 'hello'],
      ['a number with text stuck to it', '3000abc'],
      ['a number with surrounding whitespace', ' 3000 '],
    ])('should refuse to boot for %s', (_label, raw) => {
      // The message must name the variable, not merely complain. Node's own
      // rejection says `options.port should be >= 0 and < 65536`, which never
      // mentions `PORT` and so never tells the reader what to go and fix.
      expect(() => validate(withSecret({ PORT: raw }))).toThrow(
        /^PORT must be/,
      );
    });

    // Two claims about the message, stated separately from the table above
    // because a test that only says "it threw" is satisfied by a thrown
    // `undefined`.
    it('should name the variable and quote the value it rejected', () => {
      expect(() => validate(withSecret({ PORT: 'hello' }))).toThrow(
        'PORT must be a whole number between 1 and 65535, received "hello"',
      );
    });

    // The case the quoting exists for, and the reason it is asserted as a
    // literal rather than loosely. Without the quotes this message reads
    // `received  3000 ` — the spaces are invisible, the value looks perfectly
    // fine, and a strict rule becomes an infuriating one. Delete the quoting
    // from `env.validation.ts` and this is the test that goes red.
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

    // No trimming here either. Whitespace decides validity at the boundary and
    // never rewrites the value — the same rule journal content follows
    // (ADR-005). A path with spaces around it is a legal filename, so it is
    // passed on as written and the missing-file warning is what reports it.
    it('should not trim surrounding whitespace from a path', () => {
      const padded = '  data/scratch.db  ';

      expect(
        validate(withSecret({ DATABASE_PATH: padded })).DATABASE_PATH,
      ).toBe(padded);
    });

    // Deliberately `in` rather than `toBeUndefined()`, because the two are not
    // the same thing here and only one of them is safe. @nestjs/config copies
    // this object back into `process.env`, and `process.env.X = undefined`
    // stores the string "undefined" rather than removing the key — so a
    // returned `{ DATABASE_PATH: undefined }` ends up as a real environment
    // variable reading "undefined", and the application opens a database file
    // by that name. `toBeUndefined()` passes in both worlds; this does not.
    it('should leave the key out entirely when DATABASE_PATH is not set', () => {
      expect('DATABASE_PATH' in validate(withSecret())).toBe(false);
    });
  });

  // The first variable with no default and no optional path. ADR-007 built
  // this machinery before there was a secret to put through it; this is what it
  // was for.
  describe('JWT_SECRET', () => {
    it('should refuse to boot when JWT_SECRET is not set', () => {
      expect(() => validate({ PORT: '3000' })).toThrow(/^JWT_SECRET must be/);
    });

    it('should refuse to boot for the empty string', () => {
      expect(() => validate({ JWT_SECRET: '' })).toThrow(/^JWT_SECRET must be/);
    });

    // The failure that actually happens: a short value copied from a tutorial.
    // A length floor cannot measure entropy — nothing can, from one string —
    // but it rules out `JWT_SECRET=secret`, which is in every wordlist.
    it('should refuse a secret shorter than 32 characters', () => {
      expect(() => validate({ JWT_SECRET: 'secret' })).toThrow(
        /at least 32 characters/,
      );
    });

    // Every other error here quotes what it received. This one must not: the
    // value is a signing key, and printing it writes it into logs, terminal
    // scrollback and CI output.
    it('should never print the secret it rejected', () => {
      const tooShort = 'abcdefgh';

      // Caught and inspected rather than matched with `toThrow`, whose string
      // form asserts *containment* — so it cannot express "and this substring
      // is absent", which is the whole claim here.
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

  // The boundary, stated as a test: these two variables are the entire
  // configuration surface of the application. Anything else in the environment
  // is not adopted by accident.
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

  // The migration CLI checks the one variable it uses and no more. Day 9 made
  // `JWT_SECRET` mandatory for the application; running that check here would
  // mean a schema change could not be applied without a signing key no
  // migration will ever use.
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

    // The same rule the server applies, through the same function, so the two
    // cannot drift into disagreeing about what a valid path is.
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
