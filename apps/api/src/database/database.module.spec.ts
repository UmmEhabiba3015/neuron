import { migrations } from './migrations';
import { buildDatabaseOptions } from './database.module';

describe('buildDatabaseOptions', () => {
  const url = 'postgres://neuron:neuron@localhost:5432/neuron';

  it('should open the Postgres database DATABASE_URL names', () => {
    expect(buildDatabaseOptions(url)).toMatchObject({ type: 'postgres', url });
  });

  it('should never let TypeORM change the schema at boot', () => {
    expect(buildDatabaseOptions(url).synchronize).toBe(false);
  });

  it('should not run migrations at boot either', () => {
    expect(buildDatabaseOptions(url).migrationsRun).not.toBe(true);
  });

  it('should carry the migrations, so the CLI and the server agree', () => {
    expect(buildDatabaseOptions(url).migrations).toBe(migrations);
  });
});
