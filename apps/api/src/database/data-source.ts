import { DataSource } from 'typeorm';
import { loadEnvironment } from '../config/env.validation';
import { buildDatabaseOptions } from './database.module';

// The TypeORM command line — `migration:generate`, `migration:run`,
// `migration:revert` — runs in a shell, not inside Nest. There is no injector,
// so there is nothing to inject `ConfigService` into, and TypeORM's CLI is
// documented to look for a file that default-exports a `DataSource`. This is
// that file, and it exists for the CLI alone: the application never imports it.
//
// It reads the environment through `loadEnvironment`, which is `validate` under
// another name, so a migration and a boot are checked by the same rules and
// disagree about nothing. `buildDatabaseOptions` is shared with
// `database.module.ts` for the same reason — a migration applied to a different
// file than the one the server opens is a failure nobody would see.
export default new DataSource(
  buildDatabaseOptions(loadEnvironment().DATABASE_PATH),
);
