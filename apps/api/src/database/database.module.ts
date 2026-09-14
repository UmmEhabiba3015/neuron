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

export const DEFAULT_DATABASE_PATH = resolve(
  __dirname,
  '../..',
  'data/neuron.db',
);

export function resolveDatabasePath(
  configuredPath: string | undefined,
  defaultPath: string,
): string {
  if (configuredPath === undefined) {
    return defaultPath;
  }

  const databasePath = resolve(process.cwd(), configuredPath);

  if (!existsSync(databasePath)) {
    logger.warn(
      `DATABASE_PATH is set to ${JSON.stringify(configuredPath)} but no database exists at ${databasePath}. ` +
        'A new, empty one is being created. If you expected to find your existing entries, check that path for a typo.',
    );
  }

  return databasePath;
}

export function buildDatabaseOptions(
  configuredPath: string | undefined,
): DataSourceOptions {
  const databasePath = resolveDatabasePath(
    configuredPath,
    DEFAULT_DATABASE_PATH,
  );

  mkdirSync(dirname(databasePath), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: databasePath,

    entities: [JournalEntry, User],
    migrations,

    synchronize: false,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        ...buildDatabaseOptions(config.get('DATABASE_PATH', { infer: true })),

        retryAttempts: 0,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
