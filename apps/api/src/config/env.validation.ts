// Every environment variable this application reads, and the shape the rest of
// the code is allowed to see. Nothing outside this folder touches
// `process.env`: configuration is read and checked here, once, at boot, in the
// same way SQL lives only in the repository and status codes live only in the
// controller (ADR-007).
//
// `PORT` is a number here rather than the string the operating system hands
// over, and that type change is the actual fix rather than a tidy-up.
// `listen("hello")` is a legitimate request for a Unix socket file named
// `hello`, so a typo used to produce a perfectly healthy server that nothing
// could reach. `listen(3000)` can only ever mean a TCP port.
export interface EnvironmentVariables {
  PORT: number;
  // Optional in the type, and genuinely absent from the returned object when
  // the variable was not set — see the comment in `validate`.
  DATABASE_PATH?: string;
}

// Used only when `PORT` is absent. Absent means "I have no opinion about this,
// choose something sensible for me", which is the one case where a default is
// the right answer. A value that is present but wrong means "I do have an
// opinion and I expressed it badly", and quietly replacing that with a default
// hides the mistake (ADR-007).
export const DEFAULT_PORT = 3000;

const MINIMUM_PORT = 1;
const MAXIMUM_PORT = 65535;

// The quotes are not decoration. `PORT=" 3000 "` is rejected on purpose,
// because this layer does not silently edit what somebody wrote (ADR-005) —
// but a strict rule is merely infuriating unless the reader can see what is
// wrong with the value, and `received  3000 ` shows the spaces to nobody.
// `JSON.stringify` puts the quotes on and turns tabs and newlines into visible
// escapes at the same time.
const quote = (value: unknown): string => JSON.stringify(value);

const parsePort = (raw: unknown): number => {
  if (raw === undefined) {
    return DEFAULT_PORT;
  }

  // A digits-only test rather than `Number(raw)`, because `Number` is far too
  // forgiving to be a check: it reads `""` as 0, `"0x10"` as 16, `"3e3"` as
  // 3000 and `" 3000 "` as 3000. Every one of those is somebody's mistake, not
  // a port.
  //
  // Node's own checking is no substitute either. It accepts `hello`, `-5` and
  // `3000abc` without complaint — they stop being ports and become file paths,
  // and a path cannot be invalid — and on the values it does reject it says
  // `options.port should be >= 0 and < 65536`, which never mentions `PORT`, so
  // the reader is not told which variable to go and fix.
  const looksLikeAWholeNumber = typeof raw === 'string' && /^\d+$/.test(raw);
  const port = looksLikeAWholeNumber ? Number(raw) : Number.NaN;

  // `0` is legal to Node and means "pick any free port", so it is rejected
  // here rather than range-checked away by accident: somebody who types a port
  // wants that port, and a server on a different random port every run is the
  // quietest possible way to fail.
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

  // The only thing that can be decided by looking at the string. An empty
  // `DATABASE_PATH=` names no file at all, so it is a mistake with certainty.
  // A path that is merely *wrong* — `data/nueron.db` for `data/neuron.db` — has
  // the right shape, the right characters and the right extension, and no
  // amount of inspecting it will ever reveal the typo. That mistake is caught
  // against the filesystem instead, in `database.module.ts` (ADR-007).
  if (typeof raw !== 'string' || raw === '') {
    throw new Error(
      `DATABASE_PATH must be a non-empty path, received ${quote(raw)}`,
    );
  }

  return raw;
};

// Handed to `ConfigModule.forRoot({ validate })`, which calls it once while the
// application is starting and before any provider is constructed. Throwing here
// is what stops the application: a value that is wrong must prevent a boot
// rather than surface hours later as a health check nobody can explain.
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated: EnvironmentVariables = { PORT: parsePort(config.PORT) };

  const databasePath = parseDatabasePath(config.DATABASE_PATH);

  // The key is added only when the variable was actually set, and that is a
  // correctness requirement rather than tidiness. @nestjs/config copies
  // whatever this function returns back into `process.env`, and
  // `process.env.DATABASE_PATH = undefined` stores the five-character string
  // "undefined" instead of removing the key — so returning
  // `{ DATABASE_PATH: undefined }` would have the application open a database
  // file literally called `undefined`.
  if (databasePath !== undefined) {
    validated.DATABASE_PATH = databasePath;
  }

  return validated;
}
