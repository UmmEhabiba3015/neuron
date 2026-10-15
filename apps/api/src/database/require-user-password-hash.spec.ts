import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { entities } from './entities';
import { migrations } from './migrations';
import { RequireUserPasswordHash1792063401155 } from './migrations/1792063401155-RequireUserPasswordHash';

/*
 * The database is a file in a temporary folder and not ':memory:', because
 * "before" and "after" are two connections with two migration lists, and an
 * in-memory database does not outlive its connection.
 *
 * users is rebuilt, and sessions, days and entries point at it, so their keys
 * are checked as well as users itself.
 */
describe('RequireUserPasswordHash', () => {
  const position = migrations.indexOf(RequireUserPasswordHash1792063401155);
  const migrationsBefore = migrations.slice(0, position);
  const migrationsThrough = migrations.slice(0, position + 1);

  const CHILDREN = ['sessions', 'days', 'entries'] as const;

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
    directory = mkdtempSync(join(tmpdir(), 'neuron-require-password-hash-'));
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
        ('alice', 'alice@example.com', '2026-08-01T00:00:00.000Z', '$argon2id$alice', 'Alice', 'UTC'),
        ('bob',   'Bob@Example.com',   '2026-08-01T00:00:01.000Z', '$argon2id$bob',   'Bob',   'Asia/Karachi')
    `);
    await database.query(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, created_at, expires_at, revoked_at) VALUES
        ('s1', 'alice', 'hash-1', '2026-08-09T10:00:00.000Z', '2026-09-08T10:00:00.000Z', NULL)
    `);
    await database.query(`
      INSERT INTO days (id, date, mood, created_at, user_id) VALUES
        ('alice-9th', '2026-08-09', 'Even', '2026-08-09T10:00:00.000Z', 'alice')
    `);
    await database.query(`
      INSERT INTO entries (id, content, created_at, user_id, day_id, deleted_at) VALUES
        ('e1', 'the morning', '2026-08-09T10:00:00.000Z', 'alice', 'alice-9th', NULL)
    `);
  };

  const beforeTheMigration = async (): Promise<DataSource> => {
    const database = await open(migrationsBefore);
    await database.runMigrations();
    await seed(database);

    return database;
  };

  const usersOf = (database: DataSource) =>
    database.query<Record<string, unknown>[]>(
      `SELECT * FROM users ORDER BY id`,
    );

  const columnsOf = async (database: DataSource) =>
    (
      await database.query<
        { name: string; type: string; notnull: number; pk: number }[]
      >(`PRAGMA table_info(users)`)
    ).map(({ name, type, notnull, pk }) => ({ name, type, notnull, pk }));

  const keysToUsers = async (database: DataSource) => {
    const keys: Record<string, unknown> = {};

    for (const child of CHILDREN) {
      keys[child] = (
        await database.query<{ table: string; from: string; to: string }[]>(
          `PRAGMA foreign_key_list("${child}")`,
        )
      )
        .filter((key) => key.table === 'users')
        .map(({ table, from, to }) => ({ table, from, to }));
    }

    return keys;
  };

  const indexesOfUsers = async (database: DataSource) =>
    (
      await database.query<{ name: string; sql: string | null }[]>(
        `SELECT name, sql FROM sqlite_master
         WHERE type = 'index' AND tbl_name = 'users' ORDER BY name`,
      )
    ).map(({ name, sql }) => ({ name, sql: sql?.trim() ?? null }));

  const storedSchema = (database: DataSource) =>
    database.query<{ name: string; sql: string | null }[]>(
      `SELECT name, sql FROM sqlite_master ORDER BY name`,
    );

  const appliedMigrations = async (database: DataSource) =>
    (
      await database.query<{ name: string }[]>(
        `SELECT name FROM migrations ORDER BY id`,
      )
    ).map((row) => row.name);

  it('is in the list of migrations, so "before" in these tests means what it says', () => {
    expect(position).toBeGreaterThanOrEqual(0);
  });

  describe('once it has run', () => {
    it('marks password_hash as required, and changes no other column', async () => {
      let database = await beforeTheMigration();
      const before = await columnsOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      expect(await columnsOf(database)).toEqual(
        before.map((column) =>
          column.name === 'password_hash' ? { ...column, notnull: 1 } : column,
        ),
      );
    });

    it('has the database itself refuse a user with no password hash', async () => {
      await beforeTheMigration();
      const database = await open(migrationsThrough);
      await database.runMigrations();

      await expect(
        database.query(`
          INSERT INTO users (id, email, created_at, password_hash, name, timezone)
          VALUES ('carol', 'carol@example.com', '2026-08-02T00:00:00.000Z', NULL, 'Carol', 'UTC')
        `),
      ).rejects.toThrow('NOT NULL constraint failed: users.password_hash');
      await expect(
        database.query(
          `UPDATE users SET password_hash = NULL WHERE id = 'alice'`,
        ),
      ).rejects.toThrow('NOT NULL constraint failed: users.password_hash');
    });

    it('keeps every user exactly, and every row that points at one', async () => {
      let database = await beforeTheMigration();
      const users = await usersOf(database);
      const keys = await keysToUsers(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      expect(users).toHaveLength(2);
      expect(await usersOf(database)).toEqual(users);
      expect(await keysToUsers(database)).toEqual(keys);
      expect(await database.query(`PRAGMA foreign_key_check`)).toEqual([]);
      for (const table of CHILDREN) {
        const [row] = await database.query<{ count: number }[]>(
          `SELECT COUNT(*) AS count FROM "${table}"`,
        );
        expect([table, row.count]).toEqual([table, 1]);
      }
    });

    it('keeps the index that makes an address one account whatever its capitals', async () => {
      let database = await beforeTheMigration();
      const indexes = await indexesOfUsers(database);

      database = await open(migrationsThrough);
      await database.runMigrations();

      expect(await indexesOfUsers(database)).toEqual(indexes);
      await expect(
        database.query(`
          INSERT INTO users (id, email, created_at, password_hash, name, timezone)
          VALUES ('bob2', 'bob@example.com', '2026-08-02T00:00:00.000Z', 'h', 'Bob', 'UTC')
        `),
      ).rejects.toThrow(/UNIQUE constraint failed/);
    });

    it('still has the database refuse to delete a user that a session points at', async () => {
      await beforeTheMigration();
      const database = await open(migrationsThrough);
      await database.runMigrations();

      await expect(
        database.query(`DELETE FROM users WHERE id = 'alice'`),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('refusing', () => {
    it('refuses when a user has no password hash, says how many, and changes nothing', async () => {
      let database = await beforeTheMigration();
      await database.query(`UPDATE users SET password_hash = NULL`);

      const schemaBefore = await storedSchema(database);
      const usersBefore = await usersOf(database);
      const appliedBefore = await appliedMigrations(database);

      database = await open(migrationsThrough);

      await expect(database.runMigrations()).rejects.toThrow(
        /Cannot require a password: 2 users have no password_hash/,
      );
      expect(await storedSchema(database)).toEqual(schemaBefore);
      expect(await usersOf(database)).toEqual(usersBefore);
      expect(await appliedMigrations(database)).toEqual(appliedBefore);
    });
  });

  describe('down()', () => {
    it('makes password_hash optional again, keeping every user and key', async () => {
      let database = await beforeTheMigration();
      const columnsBefore = await columnsOf(database);
      const usersBefore = await usersOf(database);
      const keysBefore = await keysToUsers(database);
      const indexesBefore = await indexesOfUsers(database);

      database = await open(migrationsThrough);
      await database.runMigrations();
      await database.undoLastMigration();

      expect(await columnsOf(database)).toEqual(columnsBefore);
      expect(await usersOf(database)).toEqual(usersBefore);
      expect(await keysToUsers(database)).toEqual(keysBefore);
      expect(await indexesOfUsers(database)).toEqual(indexesBefore);
      expect(await database.query(`PRAGMA foreign_key_check`)).toEqual([]);

      await database.query(
        `UPDATE users SET password_hash = NULL WHERE id = 'bob'`,
      );
    });

    it('can be followed by up() again without losing anything', async () => {
      let database = await beforeTheMigration();
      const usersBefore = await usersOf(database);

      database = await open(migrationsThrough);
      await database.runMigrations();
      await database.undoLastMigration();
      await database.runMigrations();

      expect(await usersOf(database)).toEqual(usersBefore);
    });
  });
});
