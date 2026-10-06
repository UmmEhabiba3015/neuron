export interface EnvironmentVariables {
  PORT: number;
  DATABASE_PATH?: string;
  JWT_SECRET: string;
  WEB_ORIGIN: string;
}

export const DEFAULT_PORT = 3000;

const MINIMUM_PORT = 1;
const MAXIMUM_PORT = 65535;

const quote = (value: unknown): string => JSON.stringify(value);

const parsePort = (raw: unknown): number => {
  if (raw === undefined) {
    return DEFAULT_PORT;
  }

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

  if (typeof raw !== 'string' || raw === '') {
    throw new Error(
      `DATABASE_PATH must be a non-empty path, received ${quote(raw)}`,
    );
  }

  return raw;
};

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

  if (raw.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MINIMUM_SECRET_LENGTH} characters, received ${raw.length}. ` +
        'Generate one with:\n' +
        "  node -e \"console.log(require('node:crypto').randomBytes(48).toString('base64url'))\"",
    );
  }

  return raw;
};

const EXAMPLE_ORIGIN = 'http://localhost:3001';

/*
 * `new URL(raw).origin` is the origin a browser would compute for the value,
 * so comparing it with the value itself rejects everything that is not
 * already exactly an origin: a path, a trailing slash, a missing scheme,
 * surrounding whitespace, an upper-case host. The comparison is deliberately
 * exact, because CORS compares this string with the browser's `Origin` header
 * character for character and a near-miss would allow nothing at all.
 */
const isAnOrigin = (raw: string): boolean => {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.origin === raw
  );
};

const parseWebOrigin = (raw: unknown): string => {
  if (raw === undefined || raw === '') {
    throw new Error(
      'WEB_ORIGIN must be set. It names the one origin whose pages may read ' +
        'this API from a browser, so there is no safe default: a built-in ' +
        'value could trust the wrong frontend in another environment. For ' +
        `local development use ${quote(EXAMPLE_ORIGIN)}.`,
    );
  }

  if (typeof raw !== 'string' || !isAnOrigin(raw)) {
    throw new Error(
      `WEB_ORIGIN must be an origin such as ${quote(EXAMPLE_ORIGIN)} -- a ` +
        'scheme, a host and an optional port, with no path and no trailing ' +
        `slash -- received ${quote(raw)}`,
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
    WEB_ORIGIN: parseWebOrigin(config.WEB_ORIGIN),
  };

  const databasePath = parseDatabasePath(config.DATABASE_PATH);

  if (databasePath !== undefined) {
    validated.DATABASE_PATH = databasePath;
  }

  return validated;
}

export function loadMigrationEnvironment(): Pick<
  EnvironmentVariables,
  'DATABASE_PATH'
> {
  const databasePath = parseDatabasePath(process.env.DATABASE_PATH);

  return databasePath === undefined ? {} : { DATABASE_PATH: databasePath };
}
