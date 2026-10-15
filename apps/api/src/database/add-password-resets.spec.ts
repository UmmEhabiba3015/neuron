import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedUser,
} from '../../test/support/test-database';
import { AddPasswordResets1792063401156 } from './migrations/1792063401156-AddPasswordResets';
import { migrations } from './migrations';

/*
 * The table is new and empty, so there are no rows to keep. What is checked
 * is that the database itself holds the rules: a reset belongs to a user
 * that exists, and one token hash is one reset.
 */
describe('AddPasswordResets', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, 'alice');
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  const insert = (id: string, userId: string, tokenHash: string) =>
    dataSource.query(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, used_at, created_at)
       VALUES (?, ?, ?, '2026-10-15T10:30:00.000Z', NULL, '2026-10-15T10:00:00.000Z')`,
      [id, userId, tokenHash],
    );

  it('is in the list of migrations', () => {
    expect(migrations).toContain(AddPasswordResets1792063401156);
  });

  it('has the columns of a reset, and only used_at may be empty', async () => {
    const columns = await dataSource.query<
      { name: string; type: string; notnull: number; pk: number }[]
    >(`PRAGMA table_info(password_resets)`);

    expect(
      columns.map(({ name, type, notnull, pk }) => ({
        name,
        type: type.toLowerCase(),
        notnull,
        pk,
      })),
    ).toEqual([
      { name: 'id', type: 'text', notnull: 1, pk: 1 },
      { name: 'user_id', type: 'text', notnull: 1, pk: 0 },
      { name: 'token_hash', type: 'text', notnull: 1, pk: 0 },
      { name: 'expires_at', type: 'text', notnull: 1, pk: 0 },
      { name: 'used_at', type: 'text', notnull: 0, pk: 0 },
      { name: 'created_at', type: 'text', notnull: 1, pk: 0 },
    ]);
  });

  it('has the database refuse a reset for a user who does not exist', async () => {
    await expect(insert('r1', 'nobody', 'hash-1')).rejects.toThrow(
      'FOREIGN KEY constraint failed',
    );
  });

  it('has the database refuse two resets with one token hash', async () => {
    await insert('r1', 'alice', 'hash-1');

    await expect(insert('r2', 'alice', 'hash-1')).rejects.toThrow(
      'UNIQUE constraint failed: password_resets.token_hash',
    );
  });

  it('is removed again by down()', async () => {
    await dataSource.undoLastMigration();

    expect(
      await dataSource.query(
        `SELECT name FROM sqlite_master WHERE name LIKE '%password_resets%'`,
      ),
    ).toEqual([]);
  });
});
