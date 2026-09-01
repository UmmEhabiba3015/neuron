import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/env.validation';

// Nest normally identifies a provider by its class: a constructor asking for
// `EntriesService` is enough, because the class itself is the lookup key.
// `DatabaseSync` can't work that way — it comes from Node, not from us, and we
// don't want a second, differently-configured instance to be constructible by
// accident. So we invent our own key. A Symbol is unique by construction: no
// other token can ever collide with this one, even if some future module also
// wants to be called "DATABASE". Anything asking for this exact symbol gets
// this exact connection.
export const DATABASE = Symbol('DATABASE');

const logger = new Logger('DatabaseModule');

// Where the database lives when nobody says otherwise. Anchored to this file's
// location rather than to `process.cwd()`, so the database is always
// `apps/api/data/neuron.db` whether you run `pnpm dev` (cwd = apps/api) or
// `node apps/api/dist/main.js` from the repo root. `__dirname` is
// `apps/api/{src,dist}/database` in either case, hence two levels up.
export const DEFAULT_DATABASE_PATH = resolve(
  __dirname,
  '../..',
  'data/neuron.db',
);

// Takes the checked `DATABASE_PATH` (or `undefined` when it was never set) and
// decides which file to open. Both the configured path and the default are
// arguments rather than things this function reaches for, so its behaviour
// depends on nothing but what it is handed — which is what lets the rule below
// be tested against a directory that is genuinely empty, instead of against
// whatever happens to be on the machine running the tests.
export function resolveDatabasePath(
  configuredPath: string | undefined,
  defaultPath: string,
): string {
  // Nothing was asked for, so nothing is suspicious. A missing database at the
  // default path is a first run — on a freshly cloned repository there is no
  // database by definition — and warning about it every time would teach
  // everyone that this warning means nothing.
  if (configuredPath === undefined) {
    return defaultPath;
  }

  // An explicit path is resolved from the cwd, because that is where a person
  // typing one expects it to land.
  const databasePath = resolve(process.cwd(), configuredPath);

  // The other half of the rule, and the one the day exists for.
  // `DATABASE_PATH=data/nueron.db` is a typo with nothing wrong with it as a
  // string, so it survives every check `env.validation.ts` can make. Left
  // alone, `new DatabaseSync(path)` creates the missing file,
  // `CREATE TABLE IF NOT EXISTS` fills it in, and the application comes up
  // completely functional and completely empty — every endpoint working, the
  // user's entire journal apparently gone, and not one log line mentioning it.
  //
  // Saying so out loud is the weaker of the two options considered: it only
  // works if somebody reads it. Refusing to boot would catch the typo outright
  // but would also break every throwaway run that deliberately points at a new
  // file (ADR-007).
  if (!existsSync(databasePath)) {
    logger.warn(
      `DATABASE_PATH is set to ${JSON.stringify(configuredPath)} but no database exists at ${databasePath}. ` +
        'A new, empty one is being created. If you expected to find your existing entries, check that path for a typo.',
    );
  }

  return databasePath;
}

// A "factory provider": instead of Nest calling `new SomeClass()`, it calls
// this function once and hands the result to everyone who asks for DATABASE.
// That indirection is the entire point — because nothing constructs its own
// connection, a test can supply an in-memory database under the same token and
// the code under test never notices the difference.
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ): DatabaseSync => {
        const databasePath = resolveDatabasePath(
          config.get('DATABASE_PATH', { infer: true }),
          DEFAULT_DATABASE_PATH,
        );

        // SQLite will not create missing directories for us; it just fails to
        // open the file.
        mkdirSync(dirname(databasePath), { recursive: true });

        const db = new DatabaseSync(databasePath);

        // Schema-on-boot is deliberately primitive. It works precisely because
        // the schema has only ever grown one way; the moment a column needs to
        // change type or be dropped, this stops being enough and real migration
        // tooling gets evaluated. That is a later decision, not an oversight.
        //
        // Columns are snake_case because that is SQL convention, while the
        // TypeScript interface is camelCase because that is JS convention. The
        // mismatch is real and is mapped explicitly in EntriesService rather
        // than resolved by making one side speak the other's dialect.
        db.exec(`
          CREATE TABLE IF NOT EXISTS entries (
            id         TEXT PRIMARY KEY,
            content    TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `);

        return db;
      },
      // The path used to be computed when this file was loaded. It can't be any
      // more: it comes from ConfigService, which does not exist until the
      // injector does. `inject` is what tells Nest to build ConfigService first
      // and hand it to the factory — the same dependency injection every other
      // provider in the app already uses, now applied to configuration.
      inject: [ConfigService],
    },
  ],
  // A provider is private to its module unless exported. Without this line,
  // EntriesModule could import DatabaseModule and still not resolve DATABASE.
  exports: [DATABASE],
})
export class DatabaseModule {}
