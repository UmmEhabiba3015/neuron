import { DataSource } from 'typeorm';
import { createEmptyDatabase } from '../../test/support/test-database';
import { buildDatabaseOptions } from './database.module';

/*
 * The one migration since the move to Postgres. That it makes the right
 * schema is what every other test that touches the database shows; this
 * shows the way back: migration:revert takes the schema away entirely, and
 * migration:run makes it again.
 */
describe('Baseline', () => {
  let dataSource: DataSource;

  const tables = async () =>
    (
      await dataSource.query<{ name: string }[]>(
        `SELECT table_name AS name FROM information_schema.tables
          WHERE table_schema = 'public' ORDER BY table_name`,
      )
    ).map((row) => row.name);

  beforeAll(async () => {
    dataSource = new DataSource(
      buildDatabaseOptions(await createEmptyDatabase()),
    );
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('makes the five tables, takes them away again, and makes them again', async () => {
    const APPLICATION_TABLES = [
      'days',
      'entries',
      'password_resets',
      'sessions',
      'users',
    ];

    await dataSource.runMigrations();
    expect(await tables()).toEqual(
      [...APPLICATION_TABLES, 'migrations'].sort(),
    );

    /* The migrations after the baseline are undone first, newest first. */
    for (let undone = 0; undone < dataSource.migrations.length; undone++) {
      await dataSource.undoLastMigration();
    }
    expect(await tables()).toEqual(['migrations']);

    await dataSource.runMigrations();
    expect(await tables()).toEqual(
      [...APPLICATION_TABLES, 'migrations'].sort(),
    );
  });
});
