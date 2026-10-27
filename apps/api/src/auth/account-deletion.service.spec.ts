import { EntryKind, Mood } from '@neuron/contracts';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EntityManager, type DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedEntries,
} from '../../test/support/test-database';
import { DayEntity } from '../days/entities/day.entity';
import { AudioKeysRepository } from '../entries/audio-keys.repository';
import { AudioStorage } from '../entries/audio-storage';
import { EntryEntity } from '../entries/entities/entry.entity';
import { EntriesRepository } from '../entries/entries.repository';
import { UserEntity } from '../users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AccountDeletionService } from './account-deletion.service';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { SessionEntity } from './entities/session.entity';
import { PasswordService } from './password.service';

/*
 * Deleting an account (ADR-024): the password first, then the rows of five
 * tables in one transaction, children first, then the files.
 */
describe('AccountDeletionService', () => {
  const PASSWORD = 'the-right-password';
  const ALICE_LIVE = '11111111-1111-4111-8111-111111111111';
  const ALICE_DELETED = '22222222-2222-4222-8222-222222222222';
  const BOBS = '33333333-3333-4333-8333-333333333333';

  let dataSource: DataSource;
  let folder: string;
  let storage: AudioStorage;
  let service: AccountDeletionService;

  const TABLES = ['entries', 'days', 'password_resets', 'sessions', 'users'];

  const rowsOf = async (userId: string): Promise<Record<string, number>> => {
    const counts: Record<string, number> = {};

    for (const table of TABLES) {
      const column = table === 'users' ? 'id' : 'user_id';
      const [{ n }] = await dataSource.query<{ n: number }[]>(
        `SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = $1`,
        [userId],
      );
      counts[table] = Number(n);
    }

    return counts;
  };

  const memo = (id: string, audioKey: string, createdAt: string) => ({
    id,
    kind: EntryKind.Voice,
    content: null,
    audioKey,
    audioType: 'audio/webm',
    durationMs: 5000,
    createdAt,
  });

  const seedAccount = async (id: string, passwordHash: string) => {
    await dataSource.getRepository(UserEntity).insert({
      id,
      email: `${id}@example.com`,
      passwordHash,
      createdAt: '2026-10-01T00:00:00.000Z',
      name: id,
      timezone: 'UTC',
    });
    await dataSource.getRepository(SessionEntity).insert({
      id: `${id}-session`,
      userId: id,
      refreshTokenHash: `${id}-refresh-hash`,
      createdAt: '2026-10-16T00:00:00.000Z',
      expiresAt: '2026-11-16T00:00:00.000Z',
      revokedAt: null,
      userAgent: null,
      lastUsedAt: '2026-10-16T00:00:00.000Z',
    });
    await dataSource.getRepository(PasswordResetEntity).insert({
      id: `${id}-reset`,
      userId: id,
      tokenHash: `${id}-token-hash`,
      expiresAt: '2026-10-16T00:30:00.000Z',
      usedAt: null,
      createdAt: '2026-10-16T00:00:00.000Z',
    });
  };

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    folder = mkdtempSync(join(tmpdir(), 'neuron-account-deletion-'));
    storage = new AudioStorage(folder);

    const passwordService = new PasswordService();
    const hash = await passwordService.hash(PASSWORD);

    await seedAccount('alice', hash);
    await seedAccount('bob', hash);

    await seedEntries(
      dataSource,
      [
        {
          id: 'a-text',
          content: 'mine',
          createdAt: '2026-10-15T09:00:00.000Z',
        },
        memo('a-live', ALICE_LIVE, '2026-10-16T09:00:00.000Z'),
        memo('a-deleted', ALICE_DELETED, '2026-10-16T09:01:00.000Z'),
      ],
      'alice',
    );
    await seedEntries(
      dataSource,
      [memo('b-memo', BOBS, '2026-10-16T09:00:00.000Z')],
      'bob',
    );
    await dataSource
      .getRepository(DayEntity)
      .update({ userId: 'alice' }, { mood: Mood.Good });
    await new EntriesRepository(
      dataSource.getRepository(EntryEntity),
    ).markDeleted('a-deleted', 'alice', '2026-10-16T10:00:00.000Z');

    for (const key of [ALICE_LIVE, ALICE_DELETED, BOBS]) {
      await storage.write(key, Buffer.from(key));
    }

    service = new AccountDeletionService(
      dataSource,
      new UsersService(
        new UsersRepository(dataSource.getRepository(UserEntity)),
        passwordService,
      ),
      passwordService,
      new AudioKeysRepository(dataSource.getRepository(EntryEntity)),
      storage,
    );
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await closeTestDataSource(dataSource);
    rmSync(folder, { recursive: true, force: true });
  });

  const everyRow = {
    entries: 3,
    days: 2,
    password_resets: 1,
    sessions: 1,
    users: 1,
  };

  it('changes nothing for a wrong password, rows or files', async () => {
    expect(await service.delete('alice', 'not-the-password')).toBe(false);

    expect(await rowsOf('alice')).toEqual(everyRow);
    expect(existsSync(join(folder, ALICE_LIVE))).toBe(true);
    expect(existsSync(join(folder, ALICE_DELETED))).toBe(true);
  });

  it('removes every row of the account from all five tables, soft-deleted entries too', async () => {
    expect(await service.delete('alice', PASSWORD)).toBe(true);

    expect(await rowsOf('alice')).toEqual({
      entries: 0,
      days: 0,
      password_resets: 0,
      sessions: 0,
      users: 0,
    });
  });

  it('deletes children first: entries, days, password_resets, sessions, users', async () => {
    const deleting = jest.spyOn(EntityManager.prototype, 'delete');

    await service.delete('alice', PASSWORD);

    const tables = deleting.mock.calls.map(
      ([target], call) =>
        (deleting.mock.contexts[call] as EntityManager).connection.getMetadata(
          target as never,
        ).tableName,
    );
    expect(tables).toEqual(TABLES);
  });

  it('removes the files of its memos after the commit, the soft-deleted memo included', async () => {
    const commitsBeforeRemoval: boolean[] = [];

    const remove = storage.remove.bind(storage);

    jest.spyOn(storage, 'remove').mockImplementation(async (key: string) => {
      commitsBeforeRemoval.push((await rowsOf('alice')).users === 0);

      return remove(key);
    });

    await service.delete('alice', PASSWORD);

    expect(commitsBeforeRemoval).toEqual([true, true]);
    expect(existsSync(join(folder, ALICE_LIVE))).toBe(false);
    expect(existsSync(join(folder, ALICE_DELETED))).toBe(false);
  });

  it("leaves another person's rows and files alone", async () => {
    await service.delete('alice', PASSWORD);

    expect(await rowsOf('bob')).toEqual({ ...everyRow, entries: 1, days: 1 });
    expect(existsSync(join(folder, BOBS))).toBe(true);
  });

  it('keeps every row, and every file, when the transaction fails part way', async () => {
    /*
     * A row in another table that still points at Alice makes the last
     * delete, of her user row, fail on its foreign key.
     */
    await dataSource.query(
      'CREATE TABLE blocker (user_id TEXT NOT NULL REFERENCES users(id))',
    );
    await dataSource.query("INSERT INTO blocker (user_id) VALUES ('alice')");

    try {
      await expect(service.delete('alice', PASSWORD)).rejects.toThrow(
        /violates foreign key constraint/,
      );
    } finally {
      await dataSource.query('DROP TABLE blocker');
    }
    expect(await rowsOf('alice')).toEqual(everyRow);
    expect(existsSync(join(folder, ALICE_LIVE))).toBe(true);
    expect(existsSync(join(folder, ALICE_DELETED))).toBe(true);
  });

  it('still deletes the account when a file will not go, and says so in the log', async () => {
    jest
      .spyOn(storage, 'remove')
      .mockRejectedValueOnce(new Error('permission denied'));
    const warned = jest
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => undefined);

    expect(await service.delete('alice', PASSWORD)).toBe(true);
    expect((await rowsOf('alice')).users).toBe(0);
    expect(warned).toHaveBeenCalledTimes(1);
  });
});
