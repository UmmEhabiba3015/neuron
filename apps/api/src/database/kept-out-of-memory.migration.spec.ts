import { DataSource } from 'typeorm';
import { createEmptyDatabase } from '../../test/support/test-database';
import { buildDatabaseOptions } from './database.module';
import { Baseline1793123529224 } from './migrations/1793123529224-Baseline';

/*
 * The column for keep out of memory (features.md, Ref 25). An entry written
 * before it is in memory, and the column goes again on revert.
 */
describe('KeptOutOfMemory migration', () => {
  let dataSource: DataSource;
  let url: string;

  const columnsOfEntries = async () =>
    (
      await dataSource.query<{ name: string }[]>(
        `SELECT column_name AS name FROM information_schema.columns
          WHERE table_name = 'entries'`,
      )
    ).map((row) => row.name);

  beforeAll(async () => {
    url = await createEmptyDatabase();
    dataSource = new DataSource({
      ...buildDatabaseOptions(url),
      migrations: [Baseline1793123529224],
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('marks every entry already written as in memory, and goes again on revert', async () => {
    await dataSource.query(
      `INSERT INTO users (id, email, created_at, password_hash, name, timezone)
         VALUES ('u', 'u@example.com', '2026-10-01T00:00:00.000Z', 'x', 'u', 'UTC')`,
    );
    await dataSource.query(
      `INSERT INTO days (id, date, created_at, user_id)
         VALUES ('d', '2026-10-01', '2026-10-01T00:00:00.000Z', 'u')`,
    );
    await dataSource.query(
      `INSERT INTO entries (id, kind, content, created_at, user_id, day_id)
         VALUES ('old', 'Text', 'written before', '2026-10-01T09:00:00.000Z', 'u', 'd')`,
    );

    await dataSource.destroy();
    dataSource = new DataSource(buildDatabaseOptions(url));
    await dataSource.initialize();
    await dataSource.runMigrations();

    expect(
      await dataSource.query(
        `SELECT kept_out_of_memory FROM entries WHERE id = 'old'`,
      ),
    ).toEqual([{ kept_out_of_memory: false }]);

    await expect(
      dataSource.query(
        `UPDATE entries SET kept_out_of_memory = NULL WHERE id = 'old'`,
      ),
    ).rejects.toThrow();

    await dataSource.undoLastMigration();
    expect(await columnsOfEntries()).not.toContain('kept_out_of_memory');
  });
});
