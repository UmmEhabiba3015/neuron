import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { entities } from './entities';
import { migrations } from './migrations';
import { AddEntryDeletedAt1791363323870 } from './migrations/1791363323870-AddEntryDeletedAt';

/*
 * The database is a file in a temporary folder and not ':memory:', because
 * "before" and "after" are two connections with two migration lists, and an
 * in-memory database does not outlive its connection.
 *
 * What must survive is read from the database before the migration runs and
 * is not typed into this file, so a column or an index added by a later
 * migration is covered without anyone remembering to add it here.
 */
describe('AddEntryDeletedAt', () => {
  const position = migrations.indexOf(AddEntryDeletedAt1791363323870);
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
    directory = mkdtempSync(join(tmpdir(), 'neuron-add-entry-deleted-at-'));
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
      `SELECT rowid, id, content, created_at, user_id, day_id FROM entries ORDER BY id`,
    );

  const columnsOf = async (database: DataSource) =>
    (
      await database.query<
        {
          name: string;
          type: string;
          notnull: number;
          pk: number;
          dflt_value: string | null;
        }[]
      >(`PRAGMA table_info(entries)`)
    ).map(({ name, type, notnull, pk, dflt_value }) => ({
      name,
      type,
      notnull,
      pk,
      default: dflt_value,
    }));

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

  /*
   * Where SQLite keeps the table and each of its indexes inside the file. A
   * rebuild writes a new table and so gives it a new place. An in-place
   * change leaves every one of these numbers as it was.
   */
  const placesOf = (database: DataSource) =>
    database.query<{ name: string; rootpage: number }[]>(
      `SELECT name, rootpage FROM sqlite_master
       WHERE tbl_name = 'entries' ORDER BY name`,
    );

  const storedSchema = (database: DataSource) =>
    database.query<{ name: string; sql: string | null }[]>(
      `SELECT name, sql FROM sqlite_master ORDER BY name`,
    );

  const constraintNamesOf = async (database: DataSource) => {
    const runner = database.createQueryRunner();

    try {
      const table = await runner.getTable('entries');

      return (table?.foreignKeys ?? []).map((key) => key.name).sort();
    } finally {
      await runner.release();
    }
  };

  /*
   * indexOf answers -1 for a migration that is not in the list, and
   * slice(0, -1) would then quietly mean "all but the last".
   */
  it('is in the list of migrations, so "before" in these tests means what it says', () => {
    expect(position).toBeGreaterThanOrEqual(0);
    expect(migrationsThrough).toHaveLength(migrationsBefore.length + 1);
  });

  describe('up()', () => {
    let before: {
      columns: Awaited<ReturnType<typeof columnsOf>>;
      foreignKeys: Awaited<ReturnType<typeof foreignKeysOf>>;
      indexes: Awaited<ReturnType<typeof indexesOf>>;
      places: Awaited<ReturnType<typeof placesOf>>;
      rows: Awaited<ReturnType<typeof rowsOf>>;
    };
    let database: DataSource;

    beforeEach(async () => {
      database = await beforeTheMigration();

      before = {
        columns: await columnsOf(database),
        foreignKeys: await foreignKeysOf(database),
        indexes: await indexesOf(database),
        places: await placesOf(database),
        rows: await rowsOf(database),
      };

      database = await open(migrationsThrough);
      await database.runMigrations();
    });

    it('adds deleted_at as text, nullable, with no default, and adds nothing else', async () => {
      expect(await columnsOf(database)).toEqual([
        ...before.columns,
        { name: 'deleted_at', type: 'TEXT', notnull: 0, pk: 0, default: null },
      ]);
    });

    it('keeps every foreign key that entries had', async () => {
      expect(before.foreignKeys).toHaveLength(2);
      expect(await foreignKeysOf(database)).toEqual(before.foreignKeys);
    });

    it('keeps the foreign keys readable by name, which TypeORM needs', async () => {
      expect(await constraintNamesOf(database)).toEqual([
        'FK_entries_day',
        'FK_entries_user',
      ]);
    });

    it('keeps every index that entries had, and adds none', async () => {
      expect(before.indexes.map((index) => index.name)).toContain(
        'IDX_entries_day_id',
      );
      expect(await indexesOf(database)).toEqual(before.indexes);
    });

    it('does not rebuild the table: it and its indexes are where they were', async () => {
      expect(before.places.length).toBeGreaterThanOrEqual(2);
      expect(await placesOf(database)).toEqual(before.places);
    });

    it('preserves every entry exactly, and marks every one of them alive', async () => {
      expect(await rowsOf(database)).toEqual(before.rows);

      expect(
        await database.query(`SELECT id, deleted_at FROM entries ORDER BY id`),
      ).toEqual([
        { id: 'e1', deleted_at: null },
        { id: 'e2', deleted_at: null },
        { id: 'e3', deleted_at: null },
      ]);
    });

    it('still has the database enforce both foreign keys', async () => {
      await expect(
        database.query(`
          INSERT INTO entries (id, content, created_at, user_id, day_id)
          VALUES ('e4', 'no such day', '2026-08-10T10:00:00.000Z', 'alice', 'nowhere')
        `),
      ).rejects.toThrow('FOREIGN KEY constraint failed');

      await expect(
        database.query(`
          INSERT INTO entries (id, content, created_at, user_id, day_id)
          VALUES ('e4', 'no such user', '2026-08-10T10:00:00.000Z', 'nobody', 'alice-9th')
        `),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('down()', () => {
    it('returns entries to exactly the schema it had, with its rows', async () => {
      let database = await beforeTheMigration();
      const schemaBefore = await storedSchema(database);
      const rowsBefore = await rowsOf(database);
      const placesBefore = await placesOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();
      await database.query(
        `UPDATE entries SET deleted_at = '2026-08-09T23:00:00.000Z' WHERE id = 'e2'`,
      );
      await database.undoLastMigration();

      expect(await storedSchema(database)).toEqual(schemaBefore);
      expect(await rowsOf(database)).toEqual(rowsBefore);
      expect(await placesOf(database)).toEqual(placesBefore);
      expect(await foreignKeysOf(database)).toHaveLength(2);
    });

    it('can be followed by up() again without losing anything', async () => {
      let database = await beforeTheMigration();
      const rowsBefore = await rowsOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();
      const schemaAfterUp = await storedSchema(database);

      await database.undoLastMigration();
      await database.runMigrations();

      expect(await storedSchema(database)).toEqual(schemaAfterUp);
      expect(await rowsOf(database)).toEqual(rowsBefore);
    });
  });
});
