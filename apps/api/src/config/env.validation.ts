export interface EnvironmentVariables {
  PORT: number;
  DATABASE_PATH?: string;
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

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated: EnvironmentVariables = { PORT: parsePort(config.PORT) };

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
export function loadEnvironment(): EnvironmentVariables {
  return validate(process.env);
}
