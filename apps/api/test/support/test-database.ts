import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../../src/database/database.module';
import { dayFor } from '../../src/days/day-boundary';
import { DayEntity } from '../../src/days/entities/day.entity';
import { DaysRepository } from '../../src/days/days.repository';
import { EntryEntity } from '../../src/entries/entities/entry.entity';
import { UserEntity } from '../../src/users/entities/user.entity';

/*
 * The zone a test account is in unless the test says otherwise. UTC, so that
 * a date in a test can be read straight off the instant beside it.
 */
export const SEEDED_TIMEZONE = 'UTC';

/*
 * Every account has a password hash, so a seeded one has this. It is not an
 * argon2 hash of anything, so no password signs a seeded account in.
 */
export const SEEDED_PASSWORD_HASH = 'seeded-account-with-no-usable-password';

/*
 * The Postgres server the tests use. Every test file makes a database of its
 * own in it, so files that run at the same time never see each other's
 * rows, and drops it when the file is done. The default is the server in
 * compose.yaml.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://neuron:neuron@localhost:5432/neuron';

export const START_POSTGRES_HINT =
  `The tests need the Postgres server at ${TEST_DATABASE_URL}. ` +
  'Start it with `docker compose up -d` from the repository root, or set ' +
  'TEST_DATABASE_URL to another server.';

/* The same server, another database in it. */
export function urlOfDatabase(name: string): string {
  const url = new URL(TEST_DATABASE_URL);
  url.pathname = `/${name}`;

  return url.toString();
}

/*
 * A connection to the server's own database, for making and dropping the
 * test databases. One per file, made when first needed.
 */
let server: DataSource | undefined;

async function theServer(): Promise<DataSource> {
  if (server === undefined) {
    server = new DataSource({ type: 'postgres', url: TEST_DATABASE_URL });

    try {
      await server.initialize();
    } catch (error) {
      server = undefined;
      throw new Error(`${START_POSTGRES_HINT}\n${String(error)}`, {
        cause: error,
      });
    }
  }

  return server;
}

const made: string[] = [];

/*
 * A new, empty database, dropped when the test file ends. The name is
 * random, because files run side by side in several processes.
 */
export async function createEmptyDatabase(): Promise<string> {
  const name = `neuron_test_${randomUUID().replaceAll('-', '')}`;

  await (await theServer()).query(`CREATE DATABASE "${name}"`);
  made.push(name);

  return urlOfDatabase(name);
}

/*
 * A database with every migration applied, as `pnpm migration:run` leaves
 * it, and its address. A suite that starts the API as a real process needs
 * one: the sweep at start reads the entries table before the API listens
 * (ADR-024).
 */
export async function createMigratedDatabase(): Promise<string> {
  const url = await createEmptyDatabase();
  const dataSource = new DataSource(buildDatabaseOptions(url));

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  return url;
}

/*
 * The database of this test file, migrated once and emptied for each test
 * that asks for it, which is cheaper than a database per test and as clean:
 * every table the application has is truncated, so each test starts from
 * nothing, as it did with SQLite's in-memory database.
 */
let fileDatabase: string | undefined;

export async function createTestDataSource(): Promise<DataSource> {
  fileDatabase ??= await createMigratedDatabase();

  const dataSource = new DataSource(buildDatabaseOptions(fileDatabase));
  await dataSource.initialize();

  const tables = dataSource.entityMetadatas
    .map((metadata) => `"${metadata.tableName}"`)
    .join(', ');
  await dataSource.query(`TRUNCATE ${tables}`);

  return dataSource;
}

export async function closeTestDataSource(dataSource: DataSource) {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}

/*
 * When the file is done, its databases go. WITH (FORCE) ends any connection
 * a failed test left open, so a failure never leaves a database behind.
 * Registered here, at import, because a hook can only be registered while
 * the file is being read, and every file that makes a database imports this.
 *
 * Postgres makes and drops databases one at a time, so while a dozen files
 * finish together a drop can wait several seconds for its turn: longer than
 * Jest's five-second default for a hook.
 */
const DROP_TIMEOUT_MS = 60_000;

if (typeof afterAll === 'function') {
  afterAll(async () => {
    if (server === undefined) {
      return;
    }

    for (const name of made.splice(0)) {
      await server.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    }

    await server.destroy();
    server = undefined;
    fileDatabase = undefined;
  }, DROP_TIMEOUT_MS);
}

/*
 * A seeded entry names what its test cares about. Everything else is the
 * column's default: a typed entry, with no audio.
 */
export type SeededEntry = Pick<EntryEntity, 'id' | 'createdAt'> &
  Partial<EntryEntity>;

export async function seedEntries(
  dataSource: DataSource,
  entries: SeededEntry[],
  userId?: string,
): Promise<void> {
  if (userId === undefined) {
    await dataSource.getRepository(EntryEntity).insert(entries);
    return;
  }

  /*
   * An entry must have a day, so a seeded entry gets the one the application
   * would have filed it under. dayFor is the only place the rule is written,
   * and it is asked here rather than copied. The zone is the one seedUser
   * gives.
   */
  const days = new DaysRepository(dataSource.getRepository(DayEntity));

  for (const entry of entries) {
    const day = await days.findOrCreate(
      userId,
      dayFor(entry.createdAt, SEEDED_TIMEZONE),
    );

    await dataSource
      .getRepository(EntryEntity)
      .insert({ ...entry, userId, dayId: day.id });
  }
}

/*
 * Callers name accounts the way a person would -- authenticate(server,
 * 'alice') -- so anything without an @ is turned into an address here rather
 * than at every call site.
 */
export async function authenticate(
  server: App,
  who = 'test-user',
  timezone = SEEDED_TIMEZONE,
): Promise<string> {
  const email = who.includes('@') ? who : `${who}@example.com`;
  const password = 'a-long-enough-test-password';

  await request(server)
    .post('/auth/register')
    .send({ email, password, name: who, timezone })
    .expect(201);

  return login(server, who);
}

/*
 * Signing in again as an account that already exists. A suite that moves the
 * clock needs this: an access token lasts fifteen minutes, so one issued
 * before the clock jumped a day is expired after it.
 */
export async function login(server: App, who = 'test-user'): Promise<string> {
  const email = who.includes('@') ? who : `${who}@example.com`;
  const password = 'a-long-enough-test-password';

  const response = await request(server)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return `Bearer ${(response.body as { accessToken: string }).accessToken}`;
}

export async function seedUser(
  dataSource: DataSource,
  id = 'test-caller-id',
): Promise<string> {
  await dataSource.getRepository(UserEntity).insert({
    id,
    email: `${id}@example.com`,
    createdAt: '2026-09-01T00:00:00.000Z',
    passwordHash: SEEDED_PASSWORD_HASH,
    name: id,
    timezone: SEEDED_TIMEZONE,
  });

  return id;
}
