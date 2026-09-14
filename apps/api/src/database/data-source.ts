import { DataSource } from 'typeorm';
import { loadMigrationEnvironment } from '../config/env.validation';
import { buildDatabaseOptions } from './database.module';

export default new DataSource(
  buildDatabaseOptions(loadMigrationEnvironment().DATABASE_PATH),
);
