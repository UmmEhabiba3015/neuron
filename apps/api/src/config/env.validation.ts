export interface EnvironmentVariables {
  PORT: number;
  DATABASE_PATH?: string;
  JWT_SECRET: string;
}

// Used only when PORT is absent. A value that is present but wrong is a
// mistake, not a request for a default (ADR-007).
export const DEFAULT_PORT = 3000;

const MINIMUM_PORT = 1;
const MAXIMUM_PORT = 65535;

// Quoting makes whitespace and control characters visible in the error.
const quote = (value: unknown): string => JSON.stringify(value);

const parsePort = (raw: unknown): number => {
  if (raw === undefined) {
    return DEFAULT_PORT;
  }

  // Digits-only rather than `Number(raw)`, which reads "" as 0, "0x10" as 16
  // and "3e3" as 3000. Port 0 is rejected too: Node reads it as "any free
  // port", so the server would move every run.
  const looksLikeAWholeNumber = typeof raw === 'string' && /^\d+$/.test(raw);
  const port = looksLikeAWholeNumber ? Number(raw) : Number.NaN;

  if (!looksLikeAWholeNumber || port < MINIMUM_PORT || port > MAXIMUM_PORT) {
    throw new Error(
      `PORT must be a whole number between ${MINIMUM_PORT} and ${MAXIMUM_PORT}, received ${quote(raw)}`,
    );
  }

  return port;
};

const parseDatabasePath = (raw: unknown): string | undefined => {
  if (raw === undefined) {
    return undefined;
  }

  // Only emptiness can be judged from the string. A path that is merely wrong
  // (`data/nueron.db`) is caught against the filesystem in database.module.ts.
  if (typeof raw !== 'string' || raw === '') {
    throw new Error(
      `DATABASE_PATH must be a non-empty path, received ${quote(raw)}`,
    );
  }

  return raw;
};

// The first real secret this project has had, and the first variable with no
// default and no optional path: ADR-007 built this machinery before there was
// anything sensitive to put through it, and this is what it was for.
//
// **There is deliberately no fallback.** A default signing secret would live in
// the source, so anyone who could read the repository could mint a token for
// any user — which is worse than having no secret at all, because it looks
// configured. A random one generated at boot is no better in a different way:
// every restart would silently invalidate every token in circulation, and
// nothing would report it.
//
// So the application refuses to start. That is stricter than the
// `DATABASE_PATH` rule, which only warns, and the difference is what failure
// looks like: a mistyped database path produces an empty journal, which is
// recoverable, while a weak or shared signing key produces forged identities,
// which is not.
const MINIMUM_SECRET_LENGTH = 32;

const parseJwtSecret = (raw: unknown): string => {
  if (raw === undefined || raw === '') {
    throw new Error(
      'JWT_SECRET must be set. It signs every access token, so there is no safe ' +
        'default: a value committed to source would let anyone who can read this ' +
        'repository forge a token for any user. Generate one with:\n' +
        "  node -e \"console.log(require('node:crypto').randomBytes(48).toString('base64url'))\"",
    );
  }

  if (typeof raw !== 'string') {
    throw new Error(`JWT_SECRET must be a string, received ${quote(raw)}`);
  }

  // A length floor rather than an entropy test, because entropy cannot be
  // measured from one string — "aaaa...a" and a random 32-byte value are
  // indistinguishable to any check this function could make. What a minimum
  // does rule out is the failure that actually happens: `JWT_SECRET=secret`
  // copied from a tutorial, which is in every wordlist ever assembled.
  //
  // The value is never quoted in this error. Every other message here prints
  // what it received, and doing that with a signing key would write it into
  // logs, terminal scrollback and CI output.
  if (raw.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MINIMUM_SECRET_LENGTH} characters, received ${raw.length}. ` +
        'Generate one with:\n' +
        "  node -e \"console.log(require('node:crypto').randomBytes(48).toString('base64url'))\"",
    );
  }

  return raw;
};

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated: EnvironmentVariables = {
    PORT: parsePort(config.PORT),
    JWT_SECRET: parseJwtSecret(config.JWT_SECRET),
  };

  const databasePath = parseDatabasePath(config.DATABASE_PATH);

  // The key is added only when set. @nestjs/config copies this back into
  // `process.env`, where `undefined` becomes the string "undefined" — which
  // would open a database file literally called `undefined`.
  if (databasePath !== undefined) {
    validated.DATABASE_PATH = databasePath;
  }

  return validated;
}

// For the migration CLI, which boots no injector but must not become a second,
// unchecked reader of `process.env`.
//
// **Deliberately narrower than `validate`.** Day 9 made `JWT_SECRET` mandatory
// for the *application*, and running that check here would mean a schema change
// could not be applied without supplying a signing key the migration will never
// use — so a deployment would have to hand a secret to a tool that has no
// business seeing one, and `pnpm migration:run` would fail on a fresh clone for
// a reason that has nothing to do with the database.
//
// The variable each entry point needs is the variable each entry point checks.
// `DATABASE_PATH` is validated by exactly the same function the server uses, so
// the two cannot drift.
export function loadMigrationEnvironment(): Pick<
  EnvironmentVariables,
  'DATABASE_PATH'
> {
  const databasePath = parseDatabasePath(process.env.DATABASE_PATH);

  return databasePath === undefined ? {} : { DATABASE_PATH: databasePath };
}
