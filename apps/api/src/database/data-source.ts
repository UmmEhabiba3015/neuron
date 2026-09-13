import { DataSource } from 'typeorm';
import { loadMigrationEnvironment } from '../config/env.validation';
import { buildDatabaseOptions } from './database.module';

// For the TypeORM CLI only — it runs in a shell with no injector, and looks for
// a file that default-exports a DataSource. The application never imports this.
// Options are shared with database.module.ts so a migration cannot be applied
// to a different file than the one the server opens.
//
// `loadMigrationEnvironment`, not `loadEnvironment`: this tool needs
// `DATABASE_PATH` and nothing else. Validating the application's whole
// configuration here would make a schema change require a `JWT_SECRET` that no
// migration will ever use.
export default new DataSource(
  buildDatabaseOptions(loadMigrationEnvironment().DATABASE_PATH),
);
