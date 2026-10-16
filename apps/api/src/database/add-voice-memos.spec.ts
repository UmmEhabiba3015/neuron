import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { entities } from './entities';
import { migrations } from './migrations';
import { AddVoiceMemos1792150486058 } from './migrations/1792150486058-AddVoiceMemos';

/*
 * The database is a file in a temporary folder and not ':memory:', because
 * "before" and "after" are two connections with two migration lists, and an
 * in-memory database does not outlive its connection.
 *
 * entries is rebuilt, so everything a rebuild could lose is read from the
 * database before the migration and compared after it.
 */
describe('AddVoiceMemos', () => {
  const position = migrations.indexOf(AddVoiceMemos1792150486058);
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
    directory = mkdtempSync(join(tmpdir(), 'neuron-add-voice-memos-'));
    databaseFile = join(directory, 'neuron.db');
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    rmSync(directory, { recursive: true, force: true });
  });

  /* Raw SQL, because the entity describes the schema after this migration. */
  const seed = async (database: DataSource) => {
    await database.query(`
      INSERT INTO users (id, email, created_at, password_hash, name, timezone) VALUES
        ('alice', 'alice@example.com', '2026-08-01T00:00:00.000Z', 'h', 'Alice', 'UTC')
    `);
    await database.query(`
      INSERT INTO days (id, date, mood, created_at, user_id) VALUES
        ('alice-9th', '2026-08-09', 'Even', '2026-08-09T10:00:00.000Z', 'alice')
    `);
    await database.query(`
      INSERT INTO entries (id, content, created_at, user_id, day_id, deleted_at) VALUES
        ('e1', 'the morning', '2026-08-09T10:00:00.000Z', 'alice', 'alice-9th', NULL),
        ('e2', 'deleted',     '2026-08-09T11:00:00.000Z', 'alice', 'alice-9th', '2026-08-09T12:00:00.000Z')
    `);
  };

  const beforeTheMigration = async (): Promise<DataSource> => {
    const database = await open(migrationsBefore);
    await database.runMigrations();
    await seed(database);

    return database;
  };

  const afterTheMigration = async (): Promise<DataSource> => {
    await beforeTheMigration();
    const database = await open(migrationsThrough);
    await database.runMigrations();

    return database;
  };

  const OLD_COLUMNS = `id, content, created_at, user_id, day_id, deleted_at`;

  const oldRowsOf = (database: DataSource) =>
    database.query<Record<string, unknown>[]>(
      `SELECT ${OLD_COLUMNS} FROM entries ORDER BY id`,
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
      await database.query<{ table: string; from: string; to: string }[]>(
        `PRAGMA foreign_key_list(entries)`,
      )
    )
      .map(({ table, from, to }) => ({ table, from, to }))
      .sort((a, b) => a.table.localeCompare(b.table));

  const indexesOf = (database: DataSource) =>
    database.query<{ name: string }[]>(
      `SELECT name FROM sqlite_master
       WHERE type = 'index' AND tbl_name = 'entries' AND sql IS NOT NULL
       ORDER BY name`,
    );

  const constraintNamesOf = async (database: DataSource) => {
    const runner = database.createQueryRunner();

    try {
      const table = await runner.getTable('entries');

      return {
        foreignKeys: (table?.foreignKeys ?? []).map((key) => key.name).sort(),
        checks: (table?.checks ?? []).map((check) => check.name),
      };
    } finally {
      await runner.release();
    }
  };

  const insert = (database: DataSource, values: string) =>
    database.query(`
      INSERT INTO entries
        (id, kind, content, audio_key, audio_type, duration_ms, created_at, user_id, day_id)
      VALUES ${values}
    `);

  it('is in the list of migrations, so "before" in these tests means what it says', () => {
    expect(position).toBeGreaterThanOrEqual(0);
  });

  describe('up()', () => {
    it('adds kind, defaulting to Text, and the three audio columns, and lets content be empty', async () => {
      const before = await columnsOf(await beforeTheMigration());
      const database = await open(migrationsThrough);
      await database.runMigrations();

      expect(await columnsOf(database)).toEqual([
        ...before.map((column) =>
          column.name === 'content' ? { ...column, notnull: 0 } : column,
        ),
        { name: 'kind', type: 'TEXT', notnull: 1, pk: 0, default: "'Text'" },
        { name: 'audio_key', type: 'TEXT', notnull: 0, pk: 0, default: null },
        { name: 'audio_type', type: 'TEXT', notnull: 0, pk: 0, default: null },
        {
          name: 'duration_ms',
          type: 'INTEGER',
          notnull: 0,
          pk: 0,
          default: null,
        },
      ]);
    });

    it('keeps every entry exactly, deleted ones included, and makes each one Text with no audio', async () => {
      const rowsBefore = await oldRowsOf(await beforeTheMigration());
      const database = await open(migrationsThrough);
      await database.runMigrations();

      expect(await oldRowsOf(database)).toEqual(rowsBefore);
      expect(
        await database.query(
          `SELECT id, kind, audio_key, audio_type, duration_ms FROM entries ORDER BY id`,
        ),
      ).toEqual([
        {
          id: 'e1',
          kind: 'Text',
          audio_key: null,
          audio_type: null,
          duration_ms: null,
        },
        {
          id: 'e2',
          kind: 'Text',
          audio_key: null,
          audio_type: null,
          duration_ms: null,
        },
      ]);
    });

    it('keeps both foreign keys, readable by name, and the index on day_id', async () => {
      const before = await beforeTheMigration();
      const keys = await foreignKeysOf(before);
      const indexes = await indexesOf(before);
      const database = await open(migrationsThrough);
      await database.runMigrations();

      expect(keys).toHaveLength(2);
      expect(await foreignKeysOf(database)).toEqual(keys);
      expect(await indexesOf(database)).toEqual(indexes);
      expect(indexes).toEqual([{ name: 'IDX_entries_day_id' }]);
      expect(await constraintNamesOf(database)).toEqual({
        foreignKeys: ['FK_entries_day', 'FK_entries_user'],
        checks: ['CHK_entries_kind'],
      });
      expect(await database.query(`PRAGMA foreign_key_check`)).toEqual([]);
    });

    it('takes a memo with its audio, and a typed entry with no audio', async () => {
      const database = await afterTheMigration();

      await insert(
        database,
        `('m1', 'Voice', NULL, 'key-1', 'audio/webm', 72000, '2026-08-09T13:00:00.000Z', 'alice', 'alice-9th'),
         ('t1', 'Text', 'words', NULL, NULL, NULL, '2026-08-09T14:00:00.000Z', 'alice', 'alice-9th')`,
      );
    });

    it.each([
      [
        'a memo with no audio key',
        `('m', 'Voice', NULL, NULL, 'audio/webm', 1, '2026-08-09T13:00:00.000Z', 'alice', 'alice-9th')`,
      ],
      [
        'a memo with no length',
        `('m', 'Voice', NULL, 'k', 'audio/webm', NULL, '2026-08-09T13:00:00.000Z', 'alice', 'alice-9th')`,
      ],
      [
        'a typed entry with no words',
        `('t', 'Text', NULL, NULL, NULL, NULL, '2026-08-09T13:00:00.000Z', 'alice', 'alice-9th')`,
      ],
      [
        'a typed entry with audio',
        `('t', 'Text', 'words', 'k', 'audio/webm', 1, '2026-08-09T13:00:00.000Z', 'alice', 'alice-9th')`,
      ],
      [
        'a kind that does not exist',
        `('x', 'Video', 'words', NULL, NULL, NULL, '2026-08-09T13:00:00.000Z', 'alice', 'alice-9th')`,
      ],
    ])('has the database itself refuse %s', async (_label, values) => {
      const database = await afterTheMigration();

      await expect(insert(database, values)).rejects.toThrow(
        'CHECK constraint failed: CHK_entries_kind',
      );
    });

    it('still has the database enforce both foreign keys', async () => {
      const database = await afterTheMigration();

      await expect(
        insert(
          database,
          `('t', 'Text', 'w', NULL, NULL, NULL, '2026-08-10T10:00:00.000Z', 'alice', 'nowhere')`,
        ),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
      await expect(
        insert(
          database,
          `('t', 'Text', 'w', NULL, NULL, NULL, '2026-08-10T10:00:00.000Z', 'nobody', 'alice-9th')`,
        ),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('down()', () => {
    it('returns entries to the columns, keys, index and rows it had', async () => {
      const before = await beforeTheMigration();
      const columns = await columnsOf(before);
      const keys = await foreignKeysOf(before);
      const indexes = await indexesOf(before);
      const rows = await oldRowsOf(before);

      const database = await open(migrationsThrough);
      await database.runMigrations();
      await database.undoLastMigration();

      expect(await columnsOf(database)).toEqual(columns);
      expect(await foreignKeysOf(database)).toEqual(keys);
      expect(await indexesOf(database)).toEqual(indexes);
      expect(await oldRowsOf(database)).toEqual(rows);
    });

    it('refuses while a voice memo exists, says how many, and changes nothing', async () => {
      const database = await afterTheMigration();
      await insert(
        database,
        `('m1', 'Voice', NULL, 'key-1', 'audio/webm', 72000, '2026-08-09T13:00:00.000Z', 'alice', 'alice-9th')`,
      );
      const columns = await columnsOf(database);

      await expect(database.undoLastMigration()).rejects.toThrow(
        /Cannot remove voice memos: 1 entries are voice memos/,
      );
      expect(await columnsOf(database)).toEqual(columns);
      expect(
        await database.query(`SELECT id FROM entries WHERE kind = 'Voice'`),
      ).toEqual([{ id: 'm1' }]);
    });

    it('can be followed by up() again without losing anything', async () => {
      const rows = await oldRowsOf(await beforeTheMigration());
      const database = await open(migrationsThrough);
      await database.runMigrations();
      await database.undoLastMigration();
      await database.runMigrations();

      expect(await oldRowsOf(database)).toEqual(rows);
    });
  });
});
