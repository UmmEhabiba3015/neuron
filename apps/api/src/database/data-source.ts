import { DataSource } from 'typeorm';
import { loadEnvironment } from '../config/env.validation';
import { buildDatabaseOptions } from './database.module';

// For the TypeORM CLI only — it runs in a shell with no injector, and looks for
// a file that default-exports a DataSource. The application never imports this.
// Options are shared with database.module.ts so a migration cannot be applied
// to a different file than the one the server opens.
export default new DataSource(
  buildDatabaseOptions(loadEnvironment().DATABASE_PATH),
);
