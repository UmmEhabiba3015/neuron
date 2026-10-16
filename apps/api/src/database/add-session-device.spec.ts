import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { entities } from './entities';
import { migrations } from './migrations';
import { AddSessionDevice1792068353868 } from './migrations/1792068353868-AddSessionDevice';

/*
 * The database is a file in a temporary folder and not ':memory:', because
 * "before" and "after" are two connections with two migration lists, and an
 * in-memory database does not outlive its connection.
 *
 * sessions is rebuilt, so its rows, its key and its indexes are compared
 * with what they were before the migration ran.
 */
describe('AddSessionDevice', () => {
  const position = migrations.indexOf(AddSessionDevice1792068353868);
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
    directory = mkdtempSync(join(tmpdir(), 'neuron-add-session-device-'));
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
        ('alice', 'alice@example.com', '2026-08-01T00:00:00.000Z', '$argon2id$alice', 'Alice', 'UTC')
    `);
    await database.query(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, created_at, expires_at, revoked_at) VALUES
        ('s1', 'alice', 'hash-1', '2026-09-01T10:00:00.000Z', '2026-10-01T10:00:00.000Z', NULL),
        ('s2', 'alice', 'hash-2', '2026-09-02T11:00:00.000Z', '2026-10-02T11:00:00.000Z', '2026-09-03T00:00:00.000Z')
    `);
  };

  const KEPT = `id, user_id, refresh_token_hash, created_at, expires_at, revoked_at`;

  const rowsOf = (database: DataSource) =>
    database.query<Record<string, unknown>[]>(
      `SELECT ${KEPT} FROM sessions ORDER BY id`,
    );

  const columnsOf = async (database: DataSource) =>
    (
      await database.query<
        { name: string; type: string; notnull: number; pk: number }[]
      >(`PRAGMA table_info(sessions)`)
    ).map(({ name, type, notnull, pk }) => ({
      name,
      type: type.toLowerCase(),
      notnull,
      pk,
    }));

  const indexesOf = async (database: DataSource) =>
    (await database.query<{ name: string }[]>(`PRAGMA index_list(sessions)`))
      .map((index) => index.name)
      .filter((name) => !name.startsWith('sqlite_autoindex'))
      .sort();

  const foreignKeysOf = (database: DataSource) =>
    database.query<{ table: string; from: string; to: string }[]>(
      `SELECT "table", "from", "to" FROM pragma_foreign_key_list('sessions')`,
    );

  const beforeTheMigration = async (): Promise<DataSource> => {
    const database = await open(migrationsBefore);
    await database.runMigrations();
    await seed(database);

    return database;
  };

  /*
   * indexOf answers -1 for a migration that is not in the list, and
   * slice(0, -1) would then quietly mean "all but the last".
   */
  it('is in the list of migrations, so "before" in these tests means what it says', () => {
    expect(position).toBeGreaterThanOrEqual(0);
  });

  describe('up()', () => {
    let before: {
      rows: Record<string, unknown>[];
      columns: Awaited<ReturnType<typeof columnsOf>>;
      indexes: string[];
    };
    let database: DataSource;

    beforeEach(async () => {
      database = await beforeTheMigration();
      before = {
        rows: await rowsOf(database),
        columns: await columnsOf(database),
        indexes: await indexesOf(database),
      };

      database = await open(migrationsThrough);
      await database.runMigrations();
    });

    it('adds user_agent, which may be empty, and last_used_at, which may not', async () => {
      expect(await columnsOf(database)).toEqual([
        ...before.columns,
        { name: 'user_agent', type: 'text', notnull: 0, pk: 0 },
        { name: 'last_used_at', type: 'text', notnull: 1, pk: 0 },
      ]);
    });

    it('keeps every session as it was, with no user agent, last used when it began', async () => {
      expect(await rowsOf(database)).toEqual(before.rows);
      expect(
        await database.query(
          `SELECT id, user_agent, last_used_at FROM sessions ORDER BY id`,
        ),
      ).toEqual([
        {
          id: 's1',
          user_agent: null,
          last_used_at: '2026-09-01T10:00:00.000Z',
        },
        {
          id: 's2',
          user_agent: null,
          last_used_at: '2026-09-02T11:00:00.000Z',
        },
      ]);
    });

    it('keeps both indexes and the key to users, and the database still enforces it', async () => {
      expect(before.indexes).toEqual([
        'IDX_sessions_expires_at',
        'IDX_sessions_user_id',
      ]);
      expect(await indexesOf(database)).toEqual(before.indexes);
      expect(await foreignKeysOf(database)).toEqual([
        { table: 'users', from: 'user_id', to: 'id' },
      ]);

      await expect(
        database.query(`
          INSERT INTO sessions (id, user_id, refresh_token_hash, created_at, expires_at, last_used_at)
          VALUES ('s3', 'nobody', 'h', 'a', 'b', 'c')
        `),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });

    it('has the database refuse a session with no last use', async () => {
      await expect(
        database.query(`
          INSERT INTO sessions (id, user_id, refresh_token_hash, created_at, expires_at)
          VALUES ('s3', 'alice', 'h', 'a', 'b')
        `),
      ).rejects.toThrow('NOT NULL constraint failed: sessions.last_used_at');
    });

    it('is undone by down(), which keeps every session', async () => {
      await database.undoLastMigration();

      expect(await columnsOf(database)).toEqual(before.columns);
      expect(await rowsOf(database)).toEqual(before.rows);
      expect(await indexesOf(database)).toEqual(before.indexes);
    });
  });
});
