import { DEFAULT_PORT, validate } from './env.validation';

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
      expect(validate({}).PORT).toBe(DEFAULT_PORT);
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
        const port = validate({ PORT: raw }).PORT;

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
      expect(() => validate({ PORT: raw })).toThrow(/^PORT must be/);
    });

    // Two claims about the message, stated separately from the table above
    // because a test that only says "it threw" is satisfied by a thrown
    // `undefined`.
    it('should name the variable and quote the value it rejected', () => {
      expect(() => validate({ PORT: 'hello' })).toThrow(
        'PORT must be a whole number between 1 and 65535, received "hello"',
      );
    });

    // The case the quoting exists for, and the reason it is asserted as a
    // literal rather than loosely. Without the quotes this message reads
    // `received  3000 ` — the spaces are invisible, the value looks perfectly
    // fine, and a strict rule becomes an infuriating one. Delete the quoting
    // from `env.validation.ts` and this is the test that goes red.
    it('should quote the value so that invisible characters stay visible', () => {
      expect(() => validate({ PORT: ' 3000 ' })).toThrow(
        'PORT must be a whole number between 1 and 65535, received " 3000 "',
      );
    });
  });

  describe('DATABASE_PATH', () => {
    it('should refuse to boot for the empty string, naming the variable', () => {
      expect(() => validate({ DATABASE_PATH: '' })).toThrow(
        'DATABASE_PATH must be a non-empty path, received ""',
      );
    });

    it('should pass an explicit path through unchanged', () => {
      expect(validate({ DATABASE_PATH: 'data/scratch.db' }).DATABASE_PATH).toBe(
        'data/scratch.db',
      );
    });

    // No trimming here either. Whitespace decides validity at the boundary and
    // never rewrites the value — the same rule journal content follows
    // (ADR-005). A path with spaces around it is a legal filename, so it is
    // passed on as written and the missing-file warning is what reports it.
    it('should not trim surrounding whitespace from a path', () => {
      const padded = '  data/scratch.db  ';

      expect(validate({ DATABASE_PATH: padded }).DATABASE_PATH).toBe(padded);
    });

    // Deliberately `in` rather than `toBeUndefined()`, because the two are not
    // the same thing here and only one of them is safe. @nestjs/config copies
    // this object back into `process.env`, and `process.env.X = undefined`
    // stores the string "undefined" rather than removing the key — so a
    // returned `{ DATABASE_PATH: undefined }` ends up as a real environment
    // variable reading "undefined", and the application opens a database file
    // by that name. `toBeUndefined()` passes in both worlds; this does not.
    it('should leave the key out entirely when DATABASE_PATH is not set', () => {
      expect('DATABASE_PATH' in validate({})).toBe(false);
    });
  });

  // The boundary, stated as a test: these two variables are the entire
  // configuration surface of the application. Anything else in the environment
  // is not adopted by accident.
  it('should return only the variables it checks', () => {
    const validated = validate({
      PORT: '3000',
      DATABASE_PATH: 'data/scratch.db',
      HOME: '/home/somebody',
      AWS_SECRET_ACCESS_KEY: 'not ours to carry around',
    });

    expect(Object.keys(validated)).toEqual(['PORT', 'DATABASE_PATH']);
  });
});
