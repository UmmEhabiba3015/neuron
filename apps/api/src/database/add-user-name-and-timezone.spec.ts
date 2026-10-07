import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { EntriesRepository } from '../entries/entries.repository';
import { JournalEntry } from '../entries/entry.entity';
import { FULL_PAGE } from '../entries/page';
import { entities } from './entities';
import { migrations } from './migrations';
import { AddUserNameAndTimezone1791383154639 } from './migrations/1791383154639-AddUserNameAndTimezone';

/*
 * The database is a file in a temporary folder and not ':memory:', because
 * "before" and "after" are two connections with two migration lists, and an
 * in-memory database does not outlive its connection.
 *
 * users is rebuilt, and three other tables point at it. So most of what is
 * checked here is about those three: that their keys still find users, and
 * that SQLite still enforces them.
 */
describe('AddUserNameAndTimezone', () => {
  const position = migrations.indexOf(AddUserNameAndTimezone1791383154639);
  const migrationsBefore = migrations.slice(0, position);
  const migrationsThrough = migrations.slice(0, position + 1);

  const CHILDREN = ['sessions', 'days', 'entries'] as const;
  const TABLES = ['users', ...CHILDREN] as const;

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
    directory = mkdtempSync(join(tmpdir(), 'neuron-add-user-name-'));
    databaseFile = join(directory, 'neuron.db');
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    rmSync(directory, { recursive: true, force: true });
  });

  const LONG_LOCAL_PART = 'x'.repeat(70);

  /*
   * Raw SQL and not the entity, because the entity describes the schema after
   * this migration and the rows have to be written into the schema before it.
   *
   * 'umer' has no @. It is a row from before the column held an address:
   * UserNameBecomesEmail renamed the column and did not check what was in it.
   *
   * e-late was written at 02:00Z on the 10th and filed under the 9th, which
   * is where the 4am rule put it.
   */
  const seed = async (database: DataSource) => {
    await database.query(
      `INSERT INTO users (id, email, created_at, password_hash) VALUES
        ('alice',  'alice@example.com',       '2026-08-01T00:00:00.000Z', NULL),
        ('bob',    'Bob.Builder@Example.com', '2026-08-01T00:00:01.000Z', '$argon2id$bob'),
        ('legacy', 'umer',                    '2026-08-01T00:00:02.000Z', NULL),
        ('long',   ?,                         '2026-08-01T00:00:03.000Z', NULL),
        ('spaced', ' padded @example.com',    '2026-08-01T00:00:04.000Z', NULL)`,
      [`${LONG_LOCAL_PART}@example.com`],
    );
    await database.query(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, created_at, expires_at, revoked_at) VALUES
        ('s1', 'alice', 'hash-1', '2026-08-09T10:00:00.000Z', '2026-09-08T10:00:00.000Z', NULL),
        ('s2', 'bob',   'hash-2', '2026-08-09T11:00:00.000Z', '2026-09-08T11:00:00.000Z', '2026-08-09T12:00:00.000Z')
    `);
    await database.query(`
      INSERT INTO days (id, date, mood, created_at, user_id) VALUES
        ('alice-9th', '2026-08-09', 'Even', '2026-08-09T10:00:00.000Z', 'alice'),
        ('bob-9th',   '2026-08-09', NULL,   '2026-08-09T11:00:00.000Z', 'bob')
    `);
    await database.query(`
      INSERT INTO entries (id, content, created_at, user_id, day_id, deleted_at) VALUES
        ('e1',     'the morning',     '2026-08-09T10:00:00.000Z', 'alice', 'alice-9th', NULL),
        ('e-late', 'after midnight',  '2026-08-10T02:00:00.000Z', 'alice', 'alice-9th', NULL),
        ('e-gone', 'deleted',         '2026-08-09T12:00:00.000Z', 'alice', 'alice-9th', '2026-08-09T13:00:00.000Z'),
        ('e3',     'bob''s, 100% _',   '2026-08-09T11:00:00.000Z', 'bob',   'bob-9th',   NULL)
    `);
  };

  const beforeTheMigration = async (): Promise<DataSource> => {
    const database = await open(migrationsBefore);
    await database.runMigrations();
    await seed(database);

    return database;
  };

  const afterTheMigration = async (): Promise<DataSource> => {
    const database = await open(migrationsThrough);
    await database.runMigrations();

    return database;
  };

  const rowsOf = (database: DataSource, table: string) =>
    database.query<Record<string, unknown>[]>(
      `SELECT * FROM "${table}" ORDER BY id`,
    );

  const countsOf = async (database: DataSource) => {
    const counts: Record<string, number> = {};

    for (const table of TABLES) {
      const [row] = await database.query<{ count: number }[]>(
        `SELECT COUNT(*) AS count FROM "${table}"`,
      );
      counts[table] = Number(row.count);
    }

    return counts;
  };

  const columnsOf = async (database: DataSource, table: string) =>
    (
      await database.query<
        {
          name: string;
          type: string;
          notnull: number;
          pk: number;
          dflt_value: string | null;
        }[]
      >(`PRAGMA table_info("${table}")`)
    ).map(({ name, type, notnull, pk, dflt_value }) => ({
      name,
      type: type.toLowerCase(),
      notnull,
      pk,
      default: dflt_value,
    }));

  const foreignKeysOf = async (database: DataSource, table: string) =>
    (
      await database.query<
        {
          table: string;
          from: string;
          to: string;
          on_update: string;
          on_delete: string;
        }[]
      >(`PRAGMA foreign_key_list("${table}")`)
    )
      .map((key) => ({
        table: key.table,
        from: key.from,
        to: key.to,
        onUpdate: key.on_update,
        onDelete: key.on_delete,
      }))
      .sort((a, b) => a.table.localeCompare(b.table));

  const keysToUsers = async (database: DataSource) => {
    const keys: Record<string, unknown> = {};

    for (const child of CHILDREN) {
      keys[child] = (await foreignKeysOf(database, child)).filter(
        (key) => key.table === 'users',
      );
    }

    return keys;
  };

  /*
   * Indexes with their stored text, which is where lower("email") is. The
   * white space around the text is not part of what the index is.
   */
  const indexesOf = async (database: DataSource, table: string) =>
    (
      await database.query<{ name: string; sql: string | null }[]>(
        `SELECT name, sql FROM sqlite_master
         WHERE type = 'index' AND tbl_name = ? ORDER BY name`,
        [table],
      )
    ).map(({ name, sql }) => ({ name, sql: sql?.trim() ?? null }));

  /* The stored text of every table and index that is not part of users. */
  const schemaOutsideUsers = (database: DataSource) =>
    database.query<{ name: string; sql: string | null }[]>(
      `SELECT name, sql FROM sqlite_master
       WHERE tbl_name <> 'users' ORDER BY name`,
    );

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

  const foreignKeysAreOn = async (database: DataSource) => {
    const [row] =
      await database.query<{ foreign_keys: number }[]>(`PRAGMA foreign_keys`);

    return Number(row.foreign_keys) === 1;
  };

  /*
   * Each of the three tables is asked to take a row for a user who does not
   * exist, and users is asked to give up a user who still has rows.
   */
  const expectKeysToUsersEnforced = async (database: DataSource) => {
    expect(await foreignKeysAreOn(database)).toBe(true);

    await expect(
      database.query(`
        INSERT INTO sessions (id, user_id, refresh_token_hash, created_at, expires_at)
        VALUES ('s-x', 'nobody', 'h', '2026-08-09T10:00:00.000Z', '2026-09-08T10:00:00.000Z')
      `),
    ).rejects.toThrow('FOREIGN KEY constraint failed');

    await expect(
      database.query(`
        INSERT INTO days (id, date, mood, created_at, user_id)
        VALUES ('d-x', '2026-08-11', NULL, '2026-08-11T10:00:00.000Z', 'nobody')
      `),
    ).rejects.toThrow('FOREIGN KEY constraint failed');

    await expect(
      database.query(`
        INSERT INTO entries (id, content, created_at, user_id, day_id)
        VALUES ('e-x', 'no such user', '2026-08-09T10:00:00.000Z', 'nobody', 'alice-9th')
      `),
    ).rejects.toThrow('FOREIGN KEY constraint failed');

    await expect(
      database.query(`DELETE FROM users WHERE id = 'alice'`),
    ).rejects.toThrow('FOREIGN KEY constraint failed');

    expect(await database.query(`PRAGMA foreign_key_check`)).toEqual([]);
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
      counts: Awaited<ReturnType<typeof countsOf>>;
      userColumns: Awaited<ReturnType<typeof columnsOf>>;
      userIndexes: Awaited<ReturnType<typeof indexesOf>>;
      keysToUsers: Awaited<ReturnType<typeof keysToUsers>>;
      schemaOutsideUsers: Awaited<ReturnType<typeof schemaOutsideUsers>>;
      rows: Record<string, Record<string, unknown>[]>;
    };
    let database: DataSource;

    beforeEach(async () => {
      database = await beforeTheMigration();

      before = {
        counts: await countsOf(database),
        userColumns: await columnsOf(database, 'users'),
        userIndexes: await indexesOf(database, 'users'),
        keysToUsers: await keysToUsers(database),
        schemaOutsideUsers: await schemaOutsideUsers(database),
        rows: {},
      };

      for (const table of TABLES) {
        before.rows[table] = await rowsOf(database, table);
      }

      database = await afterTheMigration();
    });

    it('keeps every row of every table: the counts are the same', async () => {
      expect(before.counts).toEqual({
        users: 5,
        sessions: 2,
        days: 2,
        entries: 4,
      });
      expect(await countsOf(database)).toEqual(before.counts);
    });

    it('adds name and timezone, both required, neither with a default', async () => {
      expect(await columnsOf(database, 'users')).toEqual([
        ...before.userColumns,
        { name: 'name', type: 'text', notnull: 1, pk: 0, default: null },
        { name: 'timezone', type: 'text', notnull: 1, pk: 0, default: null },
      ]);
    });

    it('leaves password_hash nullable', async () => {
      const passwordHash = (await columnsOf(database, 'users')).find(
        (column) => column.name === 'password_hash',
      );

      expect(passwordHash?.notnull).toBe(0);
    });

    it('has the database itself refuse a user with no name, or with no timezone', async () => {
      await expect(
        database.query(`
          INSERT INTO users (id, email, created_at, timezone)
          VALUES ('new', 'new@example.com', '2026-08-01T00:00:00.000Z', 'UTC')
        `),
      ).rejects.toThrow('NOT NULL constraint failed: users.name');

      await expect(
        database.query(`
          INSERT INTO users (id, email, created_at, name)
          VALUES ('new', 'new@example.com', '2026-08-01T00:00:00.000Z', 'New')
        `),
      ).rejects.toThrow('NOT NULL constraint failed: users.timezone');
    });

    it('gives each existing account the part of its email before the @ as its name', async () => {
      expect(
        await database.query(`SELECT id, name FROM users ORDER BY id`),
      ).toEqual([
        { id: 'alice', name: 'alice' },
        { id: 'bob', name: 'Bob.Builder' },
        { id: 'legacy', name: 'umer' },
        { id: 'long', name: 'x'.repeat(60) },
        { id: 'spaced', name: 'padded' },
      ]);
    });

    it('writes no name that registration would refuse', async () => {
      const names = (
        await database.query<{ name: string }[]>(`SELECT name FROM users`)
      ).map((row) => row.name);

      for (const name of names) {
        expect(name).toBe(name.trim());
        expect(name.length).toBeGreaterThan(0);
        expect(name.length).toBeLessThanOrEqual(60);
      }
    });

    it('gives each existing account UTC as its timezone', async () => {
      expect(
        await database.query(`SELECT DISTINCT timezone FROM users`),
      ).toEqual([{ timezone: 'UTC' }]);
    });

    it('changes nothing else about a user', async () => {
      expect(
        await database.query(
          `SELECT id, email, created_at, password_hash FROM users ORDER BY id`,
        ),
      ).toEqual(before.rows.users);
    });

    it('moves nothing already written: sessions, days and entries are exactly as they were', async () => {
      for (const child of CHILDREN) {
        expect(await rowsOf(database, child)).toEqual(before.rows[child]);
      }
    });

    /*
     * e-late is the entry that would move if anything worked its day out
     * again: midnight in UTC puts 02:00Z on the 10th, and it is on the 9th.
     */
    it('leaves an entry written under the 4am rule on the date it was given', async () => {
      const repository = new EntriesRepository(
        database.getRepository(JournalEntry),
      );
      const idsOn = async (date: string) =>
        (await repository.find('alice', { date }, FULL_PAGE))
          .map((entry) => entry.id)
          .sort();

      expect(await idsOn('2026-08-09')).toEqual(['e-late', 'e1']);
      expect(await idsOn('2026-08-10')).toEqual([]);
    });

    it('leaves the stored definition of every other table and index untouched', async () => {
      expect(await schemaOutsideUsers(database)).toEqual(
        before.schemaOutsideUsers,
      );
    });

    it('keeps the foreign key from each of sessions, days and entries to users', async () => {
      expect(before.keysToUsers).toEqual({
        sessions: [expect.objectContaining({ from: 'user_id', to: 'id' })],
        days: [expect.objectContaining({ from: 'user_id', to: 'id' })],
        entries: [expect.objectContaining({ from: 'user_id', to: 'id' })],
      });
      expect(await keysToUsers(database)).toEqual(before.keysToUsers);
    });

    it('still has the database enforce all three, with foreign keys switched on', async () => {
      await expectKeysToUsersEnforced(database);
    });

    it('keeps UQ_users_email, still on lower("email")', async () => {
      expect(before.userIndexes.map((index) => index.name)).toContain(
        'UQ_users_email',
      );
      expect(await indexesOf(database, 'users')).toEqual(before.userIndexes);
      expect(
        (await indexesOf(database, 'users')).find(
          (index) => index.name === 'UQ_users_email',
        )?.sql,
      ).toContain('lower("email")');
    });

    it('still refuses a second account that differs only in capital letters', async () => {
      await expect(
        database.query(`
          INSERT INTO users (id, email, created_at, name, timezone)
          VALUES ('shouting', 'ALICE@EXAMPLE.COM', '2026-08-02T00:00:00.000Z', 'Alice', 'UTC')
        `),
      ).rejects.toThrow('UNIQUE constraint failed');

      await database.query(`
        INSERT INTO users (id, email, created_at, name, timezone)
        VALUES ('other', 'carol@example.com', '2026-08-02T00:00:00.000Z', 'Carol', 'UTC')
      `);
    });

    it('records itself as applied', async () => {
      expect((await appliedMigrations(database)).at(-1)).toBe(
        'AddUserNameAndTimezone1791383154639',
      );
    });
  });

  /*
   * An address with nothing before the @ leaves nothing to make a name
   * from. The migration stops before it writes anything.
   */
  describe('refusing', () => {
    it.each([
      ['nothing before the @', `'@example.com'`],
      ['only spaces before the @', `'   @example.com'`],
      ['nothing at all', `''`],
    ])(
      'refuses to run for an email with %s, and says how many',
      async (_label, email) => {
        let database = await beforeTheMigration();
        await database.query(`
        INSERT INTO users (id, email, created_at, password_hash)
        VALUES ('nameless', ${email}, '2026-08-01T00:00:09.000Z', NULL)
      `);

        database = await open(migrationsThrough);

        await expect(database.runMigrations()).rejects.toThrow(
          /Cannot require a name: 1 users have an email with nothing before the @/,
        );
      },
    );

    it('leaves the database exactly as it was when it refuses', async () => {
      let database = await beforeTheMigration();
      await database.query(`
        INSERT INTO users (id, email, created_at, password_hash)
        VALUES ('nameless', '@example.com', '2026-08-01T00:00:09.000Z', NULL)
      `);

      const schemaBefore = await storedSchema(database);
      const appliedBefore = await appliedMigrations(database);
      const rowsBefore: Record<string, unknown> = {};
      for (const table of TABLES) {
        rowsBefore[table] = await rowsOf(database, table);
      }

      database = await open(migrationsThrough);
      await expect(database.runMigrations()).rejects.toThrow();

      expect(await storedSchema(database)).toEqual(schemaBefore);
      expect(await appliedMigrations(database)).toEqual(appliedBefore);
      for (const table of TABLES) {
        expect(await rowsOf(database, table)).toEqual(rowsBefore[table]);
      }
    });
  });

  /*
   * TypeORM does not switch foreign keys off for a revert, although it means
   * to: it opens the transaction first, and SQLite ignores the switch inside
   * one. down() therefore runs with every key enforced, and the rows that
   * point at users are all still there while it does.
   */
  describe('down()', () => {
    it('returns users to the columns, the index and the rows it had', async () => {
      let database = await beforeTheMigration();
      const columnsBefore = await columnsOf(database, 'users');
      const indexesBefore = await indexesOf(database, 'users');
      const keysBefore = await keysToUsers(database);
      const outsideBefore = await schemaOutsideUsers(database);
      const rowsBefore: Record<string, unknown> = {};
      for (const table of TABLES) {
        rowsBefore[table] = await rowsOf(database, table);
      }

      database = await afterTheMigration();
      await database.undoLastMigration();

      expect(await columnsOf(database, 'users')).toEqual(columnsBefore);
      expect(await indexesOf(database, 'users')).toEqual(indexesBefore);
      expect(await keysToUsers(database)).toEqual(keysBefore);
      expect(await schemaOutsideUsers(database)).toEqual(outsideBefore);
      for (const table of TABLES) {
        expect(await rowsOf(database, table)).toEqual(rowsBefore[table]);
      }
      expect(await appliedMigrations(database)).not.toContain(
        'AddUserNameAndTimezone1791383154639',
      );
    });

    it('still has the database enforce all three foreign keys afterwards', async () => {
      await beforeTheMigration();
      const database = await afterTheMigration();
      await database.undoLastMigration();

      await expectKeysToUsersEnforced(database);
    });

    it('still refuses a second account that differs only in capital letters afterwards', async () => {
      await beforeTheMigration();
      const database = await afterTheMigration();
      await database.undoLastMigration();

      await expect(
        database.query(`
          INSERT INTO users (id, email, created_at)
          VALUES ('shouting', 'ALICE@EXAMPLE.COM', '2026-08-02T00:00:00.000Z')
        `),
      ).rejects.toThrow('UNIQUE constraint failed');
    });

    it('can be followed by up() again without losing anything', async () => {
      await beforeTheMigration();
      const database = await afterTheMigration();
      const schemaAfterUp = await storedSchema(database);
      const usersAfterUp = await rowsOf(database, 'users');
      const countsAfterUp = await countsOf(database);

      await database.undoLastMigration();
      await database.runMigrations();

      expect(await storedSchema(database)).toEqual(schemaAfterUp);
      expect(await rowsOf(database, 'users')).toEqual(usersAfterUp);
      expect(await countsOf(database)).toEqual(countsAfterUp);
      await expectKeysToUsersEnforced(database);
    });
  });
});
