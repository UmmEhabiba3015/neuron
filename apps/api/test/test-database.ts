import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { migrations } from '../src/database/migrations';
import { JournalEntry } from '../src/entries/entry.entity';
import { User } from '../src/users/user.entity';

export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [JournalEntry, User],
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
  await dataSource
    .getRepository(JournalEntry)
    .insert(
      userId === undefined ? entries : entries.map((e) => ({ ...e, userId })),
    );
}

export async function authenticate(
  server: App,
  name = 'test-user',
): Promise<string> {
  const password = 'a-long-enough-test-password';

  await request(server)
    .post('/auth/register')
    .send({ name, password })
    .expect(201);

  const response = await request(server)
    .post('/auth/login')
    .send({ name, password })
    .expect(200);

  return `Bearer ${(response.body as { accessToken: string }).accessToken}`;
}

export async function seedUser(
  dataSource: DataSource,
  id = 'test-caller-id',
): Promise<string> {
  await dataSource.getRepository(User).insert({
    id,
    name: `user-${id}`,
    createdAt: '2026-09-01T00:00:00.000Z',
    passwordHash: null,
  });

  return id;
}
