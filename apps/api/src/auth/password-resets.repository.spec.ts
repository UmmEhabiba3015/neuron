import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedUser,
} from '../../test/support/test-database';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { PasswordResetsRepository } from './password-resets.repository';

const NOW = '2026-10-15T10:10:00.000Z';

describe('PasswordResetsRepository', () => {
  let dataSource: DataSource;
  let repository: PasswordResetsRepository;

  const reset = (id: string, userId: string): PasswordResetEntity => ({
    id,
    userId,
    tokenHash: `hash-of-${id}`,
    expiresAt: '2026-10-15T10:30:00.000Z',
    usedAt: null,
    createdAt: '2026-10-15T10:00:00.000Z',
  });

  const usedAtOf = async (id: string) =>
    (await repository.findByTokenHash(`hash-of-${id}`))!.usedAt;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, 'alice');
    await seedUser(dataSource, 'bob');
    repository = new PasswordResetsRepository(
      dataSource.getRepository(PasswordResetEntity),
    );

    await repository.save(reset('a1', 'alice'));
    await repository.save(reset('a2', 'alice'));
    await repository.save(reset('b1', 'bob'));
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  it('finds a reset by the hash of its token, and nothing for another hash', async () => {
    expect((await repository.findByTokenHash('hash-of-a1'))?.id).toBe('a1');
    expect(await repository.findByTokenHash('hash-of-nothing')).toBeUndefined();
  });

  it('marks an unused reset used, and says that this call was the one', async () => {
    expect(await repository.markUsed('a1', NOW)).toBe(true);
    expect(await usedAtOf('a1')).toBe(NOW);
  });

  it('does not mark a used reset again, and says so', async () => {
    await repository.markUsed('a1', NOW);

    expect(await repository.markUsed('a1', '2026-10-15T10:20:00.000Z')).toBe(
      false,
    );
    expect(await usedAtOf('a1')).toBe(NOW);
  });

  it('marks every unused reset of one person used, and no one else', async () => {
    await repository.markUsed('a1', '2026-10-15T10:05:00.000Z');

    expect(await repository.markAllUsedForUser('alice', NOW)).toBe(1);
    expect(await usedAtOf('a1')).toBe('2026-10-15T10:05:00.000Z');
    expect(await usedAtOf('a2')).toBe(NOW);
    expect(await usedAtOf('b1')).toBeNull();
  });
});
