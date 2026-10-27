import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from '../config/env.validation';
import { entities } from './entities';
import { migrations } from './migrations';

/*
 * The one description of the database, used by the application, by the
 * migration CLI (data-source.ts) and by the tests, so the three agree.
 *
 * The address is DATABASE_URL, which the configuration has already checked
 * (ADR-007). A database that is not there, or a server that is not running,
 * stops the start: TypeORM's first connection fails and retryAttempts is 0.
 */
export function buildDatabaseOptions(url: string): DataSourceOptions {
  return {
    type: 'postgres',
    url,

    entities,
    migrations,

    synchronize: false,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        ...buildDatabaseOptions(config.get('DATABASE_URL', { infer: true })),

        retryAttempts: 0,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
