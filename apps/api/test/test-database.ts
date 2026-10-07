import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { entities } from '../src/database/entities';
import { migrations } from '../src/database/migrations';
import { dayFor } from '../src/days/day-boundary';
import { Day } from '../src/days/day.entity';
import { DaysRepository } from '../src/days/days.repository';
import { JournalEntry } from '../src/entries/entry.entity';
import { User } from '../src/users/user.entity';

/*
 * The zone a test account is in unless the test says otherwise. UTC, so that
 * a date in a test can be read straight off the instant beside it.
 */
export const SEEDED_TIMEZONE = 'UTC';

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

export async function closeTestDataSource(dataSource: DataSource) {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}

export async function seedEntries(
  dataSource: DataSource,
  entries: JournalEntry[],
  userId?: string,
): Promise<void> {
  if (userId === undefined) {
    await dataSource.getRepository(JournalEntry).insert(entries);
    return;
  }

  /*
   * An entry must have a day, so a seeded entry gets the one the application
   * would have filed it under. dayFor is the only place the rule is written,
   * and it is asked here rather than copied. The zone is the one seedUser
   * gives.
   */
  const days = new DaysRepository(dataSource.getRepository(Day));

  for (const entry of entries) {
    const day = await days.findOrCreate(
      userId,
      dayFor(entry.createdAt, SEEDED_TIMEZONE),
    );

    await dataSource
      .getRepository(JournalEntry)
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
  await dataSource.getRepository(User).insert({
    id,
    email: `${id}@example.com`,
    createdAt: '2026-09-01T00:00:00.000Z',
    passwordHash: null,
    name: id,
    timezone: SEEDED_TIMEZONE,
  });

  return id;
}
