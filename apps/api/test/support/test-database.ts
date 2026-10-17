import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { entities } from '../../src/database/entities';
import { migrations } from '../../src/database/migrations';
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

export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities,
    migrations,
    synchronize: false,
  });

  await dataSource.initialize();
  await dataSource.runMigrations();

  return dataSource;
}

/*
 * A database file with every migration applied, as `pnpm migration:run`
 * leaves it. A suite that starts the API as a real process needs one: the
 * sweep at start reads the entries table before the API listens (ADR-024).
 */
export async function migrateDatabaseFile(path: string): Promise<void> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: path,
    entities,
    migrations,
    synchronize: false,
  });

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

export async function closeTestDataSource(dataSource: DataSource) {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
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
