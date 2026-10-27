export interface EnvironmentVariables {
  PORT: number;
  DATABASE_URL: string;
  AUDIO_PATH?: string;
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

const EXAMPLE_DATABASE_URL = 'postgres://neuron:neuron@localhost:5432/neuron';

/*
 * The address is quoted in a message with its password hidden, because the
 * message goes to a log and a log is no place for a password.
 */
const withoutPassword = (raw: string): string => {
  try {
    const url = new URL(raw);

    if (url.password !== '') {
      url.password = '***';
    }

    return url.toString();
  } catch {
    return raw.replace(/\/\/([^:@/]*):[^@/]*@/, '//$1:***@');
  }
};

/*
 * URL would quietly drop surrounding whitespace, so it is refused first, as
 * PORT refuses it (ADR-007).
 */
const isAPostgresUrl = (raw: string): boolean => {
  if (raw.trim() !== raw) {
    return false;
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  return (
    (url.protocol === 'postgres:' || url.protocol === 'postgresql:') &&
    url.hostname !== '' &&
    url.pathname.length > 1
  );
};

/*
 * Which Postgres database holds the journal. Required, as WEB_ORIGIN is:
 * a built-in address could quietly open the wrong database in another
 * environment, and an empty one would look like a journal that lost every
 * entry (ADR-007).
 */
const parseDatabaseUrl = (raw: unknown): string => {
  if (raw === undefined || raw === '') {
    throw new Error(
      'DATABASE_URL must be set. It names the Postgres database that holds ' +
        'the journal, so there is no safe default. For local development, ' +
        `start the database with \`docker compose up -d\` and use ${quote(EXAMPLE_DATABASE_URL)}.`,
    );
  }

  if (typeof raw !== 'string' || !isAPostgresUrl(raw)) {
    throw new Error(
      `DATABASE_URL must be a Postgres address such as ${quote(EXAMPLE_DATABASE_URL)} -- ` +
        'postgres://, a user and password, a host, a port and the name of the ' +
        `database -- received ${quote(typeof raw === 'string' ? withoutPassword(raw) : raw)}`,
    );
  }

  return raw;
};

/*
 * The folder voice memos are kept in (ADR-023). It may be left out, and the
 * default is then apps/api/data/audio.
 */
const parseAudioPath = (raw: unknown): string | undefined => {
  if (raw === undefined) {
    return undefined;
  }

  if (typeof raw !== 'string' || raw === '') {
    throw new Error(
      `AUDIO_PATH must be a non-empty path, received ${quote(raw)}`,
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
    DATABASE_URL: parseDatabaseUrl(config.DATABASE_URL),
  };

  const audioPath = parseAudioPath(config.AUDIO_PATH);

  if (audioPath !== undefined) {
    validated.AUDIO_PATH = audioPath;
  }

  return validated;
}

/*
 * The migration CLI needs only the database, so it checks only that, with
 * the same rule and the same message as the application.
 */
export function loadMigrationEnvironment(): Pick<
  EnvironmentVariables,
  'DATABASE_URL'
> {
  return { DATABASE_URL: parseDatabaseUrl(process.env.DATABASE_URL) };
}
