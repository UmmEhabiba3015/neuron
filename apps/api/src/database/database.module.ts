import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '../config/env.validation';
import { JournalEntry } from '../entries/entry.interface';
import { User } from '../users/user.entity';
import { migrations } from './migrations';

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
  // alone, opening the path creates the missing file, the schema arrives from
  // somewhere, and the application comes up completely functional and
  // completely empty — every endpoint working, the user's entire journal
  // apparently gone, and not one log line mentioning it.
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

// One description of the database, used by both things that open it: the
// running application below, and the migration commands in `data-source.ts`.
// Two descriptions would be two schemas — a migration run against options that
// disagree with the ones the server uses is a migration applied to the wrong
// file, which is a mistake nothing reports.
export function buildDatabaseOptions(
  configuredPath: string | undefined,
): DataSourceOptions {
  const databasePath = resolveDatabasePath(
    configuredPath,
    DEFAULT_DATABASE_PATH,
  );

  // SQLite will not create missing directories for us; it just fails to open
  // the file.
  mkdirSync(dirname(databasePath), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: databasePath,
    // Every entity, listed by hand for the same reason `migrations` is: a glob
    // that misses one fails by finding nothing rather than by failing. `User`
    // is here even though no provider asks for its repository yet — TypeORM
    // resolves `@ManyToOne(() => User)` against this list, and an entity left
    // out of it turns the relation into "Entity metadata for
    // JournalEntry#user was not found" at boot.
    entities: [JournalEntry, User],
    migrations,
    // The single most important line in this file, and ADR-010 names it
    // explicitly. `synchronize: true` is TypeORM's schema-on-boot mode: it
    // reads the entity classes and quietly reshapes the database to match
    // them on every start. That is the same mistake as the
    // `CREATE TABLE IF NOT EXISTS` this day removed, wearing a friendlier
    // name and with a much larger blast radius — it drops columns.
    //
    // Schema changes happen through migrations and nowhere else. Not at boot
    // either: `migrationsRun` is left off on purpose, so applying a migration
    // is something a person does deliberately with `pnpm migration:run`,
    // rather than something a deployment does to a production database while
    // nobody is looking.
    synchronize: false,
  };
}

// The database wiring, now one import rather than one factory.
// `TypeOrmModule.forRootAsync` is the async form for a reason: the path comes
// from `ConfigService`, which does not exist until the injector does. `inject`
// is what tells Nest to build `ConfigService` first and hand it to the factory
// — the same dependency injection every other provider in the app already
// uses, and the reason nothing here reads `process.env` (ADR-007).
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        ...buildDatabaseOptions(config.get('DATABASE_PATH', { infer: true })),
        // `@nestjs/typeorm` retries a failed connection ten times, three
        // seconds apart, before giving up. That is a sensible default for a
        // database on the far end of a network, which is not what this is: a
        // SQLite file that cannot be opened at the first attempt cannot be
        // opened at the tenth either, so the default converts an immediate,
        // readable boot failure into thirty seconds of silence followed by the
        // same message. `new DatabaseSync(path)` failed at once, and this keeps
        // it that way. Revisit on Day 24, when the database really is on a
        // network and a retry starts meaning something.
        retryAttempts: 0,
      }),
    }),
  ],
  // `TypeOrmModule` is re-exported so that a module importing this one can go
  // on to ask for `TypeOrmModule.forFeature([...])` — the same reason the
  // DATABASE symbol used to be exported. What changed is what crosses the
  // boundary: a token naming one connection became a token naming one
  // entity's repository, and `EntriesRepository` is still the only class that
  // asks for it.
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
