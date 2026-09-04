import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '../config/env.validation';
import { JournalEntry } from '../entries/entry.entity';
import { User } from '../users/user.entity';
import { migrations } from './migrations';

const logger = new Logger('DatabaseModule');

// Anchored to this file rather than `process.cwd()`, so the database is always
// `apps/api/data/neuron.db` whichever directory the process starts in.
export const DEFAULT_DATABASE_PATH = resolve(
  __dirname,
  '../..',
  'data/neuron.db',
);

// Both the configured path and the default are arguments rather than things
// this function reaches for, which is what lets it be tested against a
// genuinely empty directory.
export function resolveDatabasePath(
  configuredPath: string | undefined,
  defaultPath: string,
): string {
  // Nothing was asked for, so nothing is suspicious: a missing database at the
  // default path is a first run.
  if (configuredPath === undefined) {
    return defaultPath;
  }

  const databasePath = resolve(process.cwd(), configuredPath);

  // `DATABASE_PATH=data/nueron.db` is a typo that survives every check a string
  // can be given. Left alone, it opens a new empty file and the application
  // comes up fully functional with the journal apparently gone. Warning is the
  // weaker of the two options considered — refusing to boot would also break
  // every deliberate throwaway run (ADR-007).
  if (!existsSync(databasePath)) {
    logger.warn(
      `DATABASE_PATH is set to ${JSON.stringify(configuredPath)} but no database exists at ${databasePath}. ` +
        'A new, empty one is being created. If you expected to find your existing entries, check that path for a typo.',
    );
  }

  return databasePath;
}

// Shared with `data-source.ts`. Two descriptions would be two schemas, and a
// migration run against options that disagree with the server's is applied to
// the wrong file.
export function buildDatabaseOptions(
  configuredPath: string | undefined,
): DataSourceOptions {
  const databasePath = resolveDatabasePath(
    configuredPath,
    DEFAULT_DATABASE_PATH,
  );

  // SQLite will not create missing directories; it just fails to open the file.
  mkdirSync(dirname(databasePath), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: databasePath,
    // Listed by hand for the same reason `migrations` is. `User` is here even
    // though nothing asks for its repository: TypeORM resolves
    // `@ManyToOne(() => User)` against this list, and omitting it turns the
    // relation into "Entity metadata for JournalEntry#user was not found".
    entities: [JournalEntry, User],
    migrations,
    // Never turn this on. `synchronize: true` reshapes the database to match
    // the entity classes on every boot, and it drops columns. Schema changes
    // happen through migrations and nowhere else — `migrationsRun` is left off
    // too, so applying one is deliberate rather than something a deploy does
    // while nobody is looking (ADR-010).
    synchronize: false,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        ...buildDatabaseOptions(config.get('DATABASE_PATH', { infer: true })),
        // The default retries ten times, three seconds apart — sensible for a
        // database across a network, wrong for a local file that cannot be
        // opened at the tenth attempt if it failed at the first. Revisit on
        // Day 24.
        retryAttempts: 0,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
