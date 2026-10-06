import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { entities } from './entities';
import { migrations } from './migrations';
import { RequireEntryDay1791314102576 } from './migrations/1791314102576-RequireEntryDay';

/*
 * The database is a file in a temporary folder and not ':memory:', because
 * "before" and "after" are two connections with two migration lists, and an
 * in-memory database does not outlive its connection.
 */
describe('RequireEntryDay', () => {
  const position = migrations.indexOf(RequireEntryDay1791314102576);
  const migrationsBefore = migrations.slice(0, position);
  const migrationsThrough = migrations.slice(0, position + 1);

  let directory: string;
  let databaseFile: string;
  let dataSource: DataSource | undefined;

  const open = async (list: typeof migrations): Promise<DataSource> => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: databaseFile,
      entities,
      migrations: list,
      synchronize: false,
    });

    return dataSource.initialize();
  };

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'neuron-require-entry-day-'));
    databaseFile = join(directory, 'neuron.db');
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    rmSync(directory, { recursive: true, force: true });
  });

  /*
   * Raw SQL and not the entity, because the entity describes the schema after
   * this migration and the rows have to be written into the schema before it.
   */
  const seed = async (database: DataSource) => {
    await database.query(`
      INSERT INTO users (id, email, created_at, password_hash) VALUES
        ('alice', 'alice@example.com', '2026-08-01T00:00:00.000Z', NULL),
        ('bob',   'bob@example.com',   '2026-08-01T00:00:01.000Z', NULL)
    `);
    await database.query(`
      INSERT INTO days (id, date, mood, created_at, user_id) VALUES
        ('alice-9th', '2026-08-09', 'Even', '2026-08-09T10:00:00.000Z', 'alice'),
        ('bob-9th',   '2026-08-09', NULL,   '2026-08-09T11:00:00.000Z', 'bob')
    `);
    await database.query(`
      INSERT INTO entries (id, content, created_at, user_id, day_id) VALUES
        ('e1', 'the morning',   '2026-08-09T10:00:00.000Z', 'alice', 'alice-9th'),
        ('e2', 'the evening',   '2026-08-09T22:00:00.000Z', 'alice', 'alice-9th'),
        ('e3', 'bob''s, 100% _', '2026-08-09T11:00:00.000Z', 'bob',   'bob-9th')
    `);
  };

  const beforeTheMigration = async (): Promise<DataSource> => {
    const database = await open(migrationsBefore);
    await database.runMigrations();
    await seed(database);

    return database;
  };

  const rowsOf = (database: DataSource) =>
    database.query<Record<string, unknown>[]>(
      `SELECT id, content, created_at, user_id, day_id FROM entries ORDER BY id`,
    );

  const columnsOf = async (database: DataSource) =>
    (
      await database.query<
        { name: string; type: string; notnull: number; pk: number }[]
      >(`PRAGMA table_info(entries)`)
    ).map(({ name, type, notnull, pk }) => ({ name, type, notnull, pk }));

  const foreignKeysOf = async (database: DataSource) =>
    (
      await database.query<
        {
          table: string;
          from: string;
          to: string;
          on_update: string;
          on_delete: string;
        }[]
      >(`PRAGMA foreign_key_list(entries)`)
    )
      .map((key) => ({
        table: key.table,
        from: key.from,
        to: key.to,
        onUpdate: key.on_update,
        onDelete: key.on_delete,
      }))
      .sort((a, b) => a.table.localeCompare(b.table));

  const indexesOf = async (database: DataSource) => {
    const list = await database.query<{ name: string; unique: number }[]>(
      `PRAGMA index_list(entries)`,
    );

    const described = await Promise.all(
      list.map(async ({ name, unique }) => ({
        name,
        unique,
        columns: (
          await database.query<{ name: string }[]>(
            `PRAGMA index_info("${name}")`,
          )
        ).map((column) => column.name),
      })),
    );

    return described.sort((a, b) => a.name.localeCompare(b.name));
  };

  const appliedMigrations = async (database: DataSource) =>
    (
      await database.query<{ name: string }[]>(
        `SELECT name FROM migrations ORDER BY id`,
      )
    ).map((row) => row.name);

  const storedSchema = (database: DataSource) =>
    database.query<{ name: string; sql: string | null }[]>(
      `SELECT name, sql FROM sqlite_master ORDER BY name`,
    );

  it('is the last migration, so "before" in these tests means what it says', () => {
    expect(position).toBe(migrations.length - 1);
  });

  describe('once every migration has run', () => {
    let database: DataSource;

    beforeEach(async () => {
      database = await beforeTheMigration();
      database = await open(migrationsThrough);
      await database.runMigrations();
    });

    it('marks day_id as required', async () => {
      const dayId = (await columnsOf(database)).find(
        (column) => column.name === 'day_id',
      );

      expect(dayId).toEqual({
        name: 'day_id',
        type: 'TEXT',
        notnull: 1,
        pk: 0,
      });
    });

    /*
     * Raw SQL on purpose. Going through the entity would let TypeORM or the
     * service refuse first, and the claim is that the database refuses.
     */
    it('has the database itself refuse an entry with no day', async () => {
      await expect(
        database.query(`
          INSERT INTO entries (id, content, created_at, user_id, day_id)
          VALUES ('e4', 'no day', '2026-08-10T10:00:00.000Z', 'alice', NULL)
        `),
      ).rejects.toThrow('NOT NULL constraint failed: entries.day_id');

      await expect(
        database.query(`
          INSERT INTO entries (id, content, created_at, user_id)
          VALUES ('e4', 'no day', '2026-08-10T10:00:00.000Z', 'alice')
        `),
      ).rejects.toThrow('NOT NULL constraint failed: entries.day_id');

      expect(await rowsOf(database)).toHaveLength(3);
    });

    it('has the database refuse to take the day off an entry that has one', async () => {
      await expect(
        database.query(`UPDATE entries SET day_id = NULL WHERE id = 'e1'`),
      ).rejects.toThrow('NOT NULL constraint failed: entries.day_id');
    });

    it('still accepts an entry that has a day', async () => {
      await database.query(`
        INSERT INTO entries (id, content, created_at, user_id, day_id)
        VALUES ('e4', 'a day', '2026-08-09T12:00:00.000Z', 'alice', 'alice-9th')
      `);

      expect(await rowsOf(database)).toHaveLength(4);
    });

    it('has the database refuse an entry whose day does not exist', async () => {
      await expect(
        database.query(`
          INSERT INTO entries (id, content, created_at, user_id, day_id)
          VALUES ('e4', 'x', '2026-08-10T10:00:00.000Z', 'alice', 'no-such-day')
        `),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });

    it('has the database refuse to delete a day that an entry still points at', async () => {
      await expect(
        database.query(`DELETE FROM days WHERE id = 'alice-9th'`),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('running against a database that already holds entries', () => {
    it('preserves every entry exactly: id, content, created_at, owner and day', async () => {
      let database = await beforeTheMigration();
      const before = await rowsOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      expect(before).toHaveLength(3);
      expect(await rowsOf(database)).toEqual(before);
    });

    it('leaves the other tables with the rows they had', async () => {
      let database = await beforeTheMigration();
      const countsOf = async (from: DataSource) =>
        Promise.all(
          ['users', 'days', 'sessions'].map(
            async (table) =>
              (
                await from.query<{ c: number }[]>(
                  `SELECT COUNT(*) AS c FROM ${table}`,
                )
              )[0].c,
          ),
        );
      const before = await countsOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      expect(before).toEqual([2, 2, 0]);
      expect(await countsOf(database)).toEqual(before);
    });

    /*
     * The lists are read from the database before the migration and not
     * typed out here, so a column, key or index added by some later
     * migration is covered without anyone remembering to add it.
     */
    it('keeps every column, in the same order', async () => {
      let database = await beforeTheMigration();
      const before = await columnsOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      expect(before.map((column) => column.name)).toEqual([
        'id',
        'content',
        'created_at',
        'user_id',
        'day_id',
      ]);
      expect(await columnsOf(database)).toEqual(
        before.map((column) =>
          column.name === 'day_id' ? { ...column, notnull: 1 } : column,
        ),
      );
    });

    it('keeps every index that entries had', async () => {
      let database = await beforeTheMigration();
      const before = await indexesOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      expect(before).toContainEqual({
        name: 'IDX_entries_day_id',
        unique: 0,
        columns: ['day_id'],
      });
      expect(await indexesOf(database)).toEqual(before);
    });

    it('keeps every foreign key that entries had, and adds the one to days', async () => {
      let database = await beforeTheMigration();
      const before = await foreignKeysOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      const after = await foreignKeysOf(database);

      expect(before).toEqual([
        {
          table: 'users',
          from: 'user_id',
          to: 'id',
          onUpdate: 'NO ACTION',
          onDelete: 'NO ACTION',
        },
      ]);
      for (const key of before) {
        expect(after).toContainEqual(key);
      }
      expect(after).toContainEqual({
        table: 'days',
        from: 'day_id',
        to: 'id',
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
      });
      expect(after).toHaveLength(before.length + 1);
    });

    it('leaves no row that breaks a foreign key', async () => {
      await beforeTheMigration();

      const database = await open(migrationsThrough);
      await database.runMigrations();

      expect(await database.query(`PRAGMA foreign_key_check`)).toEqual([]);
    });
  });

  describe('refusing', () => {
    it('refuses to run when an entry has no day, and says how many', async () => {
      let database = await beforeTheMigration();
      await database.query(
        `UPDATE entries SET day_id = NULL WHERE id IN ('e1', 'e3')`,
      );

      database = await open(migrationsThrough);

      await expect(database.runMigrations()).rejects.toThrow(
        /Cannot require a day: 2 entries have no day_id/,
      );
    });

    it('leaves the database exactly as it was when it refuses', async () => {
      let database = await beforeTheMigration();
      await database.query(`UPDATE entries SET day_id = NULL WHERE id = 'e2'`);

      const schemaBefore = await storedSchema(database);
      const rowsBefore = await rowsOf(database);
      const appliedBefore = await appliedMigrations(database);

      database = await open(migrationsThrough);
      await expect(database.runMigrations()).rejects.toThrow(
        /Cannot require a day/,
      );

      expect(await storedSchema(database)).toEqual(schemaBefore);
      expect(await rowsOf(database)).toEqual(rowsBefore);
      expect(rowsBefore).toContainEqual(
        expect.objectContaining({ id: 'e2', day_id: null }),
      );
      expect(await appliedMigrations(database)).toEqual(appliedBefore);
      expect(appliedBefore).not.toContain('RequireEntryDay1791314102576');
    });

    /*
     * TypeORM switches foreign keys off while migrations run, so SQLite
     * would copy this row into the new table without complaint. The
     * migration has to look for it.
     */
    it('refuses to run when an entry points at a day that does not exist', async () => {
      let database = await beforeTheMigration();
      await database.query(
        `UPDATE entries SET day_id = 'a-day-that-was-deleted' WHERE id = 'e1'`,
      );
      const rowsBefore = await rowsOf(database);

      database = await open(migrationsThrough);

      await expect(database.runMigrations()).rejects.toThrow(
        /Cannot require a day: 1 entries have a day_id that matches no row in days/,
      );
      expect(await rowsOf(database)).toEqual(rowsBefore);
      expect(await appliedMigrations(database)).not.toContain(
        'RequireEntryDay1791314102576',
      );
    });
  });

  describe('down()', () => {
    it('returns entries to the schema it had, with its rows', async () => {
      let database = await beforeTheMigration();
      const columnsBefore = await columnsOf(database);
      const foreignKeysBefore = await foreignKeysOf(database);
      const indexesBefore = await indexesOf(database);
      const rowsBefore = await rowsOf(database);
      const appliedBefore = await appliedMigrations(database);

      database = await open(migrationsThrough);
      await database.runMigrations();
      expect(await columnsOf(database)).not.toEqual(columnsBefore);

      await database.undoLastMigration();

      expect(await columnsOf(database)).toEqual(columnsBefore);
      expect(await foreignKeysOf(database)).toEqual(foreignKeysBefore);
      expect(await indexesOf(database)).toEqual(indexesBefore);
      expect(await rowsOf(database)).toEqual(rowsBefore);
      expect(await appliedMigrations(database)).toEqual(appliedBefore);
    });

    it('lets an entry have no day again', async () => {
      await beforeTheMigration();

      const database = await open(migrationsThrough);
      await database.runMigrations();
      await database.undoLastMigration();

      await database.query(`UPDATE entries SET day_id = NULL WHERE id = 'e1'`);

      expect(await rowsOf(database)).toContainEqual(
        expect.objectContaining({ id: 'e1', day_id: null }),
      );
    });

    it('can be followed by up() again without losing anything', async () => {
      let database = await beforeTheMigration();
      const rowsBefore = await rowsOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();
      await database.undoLastMigration();
      await database.runMigrations();

      expect(await rowsOf(database)).toEqual(rowsBefore);
      expect(
        (await columnsOf(database)).find((column) => column.name === 'day_id')
          ?.notnull,
      ).toBe(1);
    });
  });
});
