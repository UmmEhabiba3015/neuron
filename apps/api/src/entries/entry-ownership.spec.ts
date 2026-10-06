import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../../test/test-database';
import { User } from '../users/user.entity';
import { Day } from '../days/day.entity';
import { DaysRepository } from '../days/days.repository';
import { DaysService } from '../days/days.service';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.entity';

describe('entry ownership', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  /*
   * An entry must have a day since RequireEntryDay, and a day must have an
   * owner who exists. A test about the owner of an entry therefore needs a
   * real day to hang the entry on, or it fails on day_id before it reaches
   * the thing it is testing.
   */
  const dayOf = async (userId: string): Promise<string> => {
    const days = new DaysRepository(dataSource.getRepository(Day), dataSource);

    return (await days.findOrCreate(userId, '2026-09-02')).id;
  };

  const columnsOf = (table: string) =>
    dataSource.query<
      { name: string; type: string; notnull: number; pk: number }[]
    >(`PRAGMA table_info(${table})`);

  describe('the users table', () => {
    it('should have exactly id, email, created_at and password_hash', async () => {
      expect((await columnsOf('users')).map((column) => column.name)).toEqual([
        'id',
        'email',
        'created_at',
        'password_hash',
      ]);
    });

    it('should store the credential as one column and never a plaintext password', async () => {
      const names = (await columnsOf('users')).map((column) => column.name);

      expect(names).toContain('password_hash');
      expect(names).not.toContain('password');
      expect(names).not.toContain('salt');
    });

    it('should allow the credential to be null for rows that predate it', async () => {
      const passwordHash = (await columnsOf('users')).find(
        (column) => column.name === 'password_hash',
      );

      expect(passwordHash?.notnull).toBe(0);
    });

    it('should require names to be unique', async () => {
      const users = dataSource.getRepository(User);

      await users.insert({
        id: 'user-1',
        email: 'habiba@example.com',
        createdAt: '2026-09-02T09:00:00.000Z',
      });

      await expect(
        users.insert({
          id: 'user-2',
          email: 'habiba@example.com',
          createdAt: '2026-09-02T09:00:01.000Z',
        }),
      ).rejects.toThrow(/UNIQUE constraint failed/);
    });
  });

  describe('the user_id column on entries', () => {
    it('should exist and require an owner', async () => {
      const userId = (await columnsOf('entries')).find(
        (column) => column.name === 'user_id',
      );

      expect(userId).toBeDefined();
      expect(userId?.type).toBe('TEXT');

      expect(userId?.notnull).toBe(1);
    });

    it('should be a foreign key pointing at users.id', async () => {
      const foreignKeys = await dataSource.query<
        { table: string; from: string; to: string }[]
      >(`PRAGMA foreign_key_list(entries)`);

      expect(foreignKeys).toContainEqual(
        expect.objectContaining({ table: 'users', from: 'user_id', to: 'id' }),
      );
    });

    it('should actually be enforced, not merely declared', async () => {
      await dataSource.getRepository(User).insert({
        id: 'user-1',
        email: 'habiba@example.com',
        createdAt: '2026-09-02T09:00:00.000Z',
      });

      await expect(
        dataSource.getRepository(JournalEntry).insert({
          id: 'entry-1',
          content: 'owned by nobody who exists',
          createdAt: '2026-09-02T09:00:00.000Z',
          userId: 'no-such-user',
          dayId: await dayOf('user-1'),
        }),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('writing and reading an owner', () => {
    it('should round-trip an owner through the entity', async () => {
      await dataSource.getRepository(User).insert({
        id: 'user-1',
        email: 'habiba@example.com',
        createdAt: '2026-09-02T09:00:00.000Z',
      });

      const entries = dataSource.getRepository(JournalEntry);

      await entries.insert({
        id: 'entry-1',
        content: 'mine',
        createdAt: '2026-09-02T09:00:01.000Z',
        userId: 'user-1',
        dayId: await dayOf('user-1'),
      });

      const stored = await entries.find({ select: { id: true, userId: true } });

      expect(stored).toEqual([{ id: 'entry-1', userId: 'user-1' }]);
    });

    it('should refuse an entry with no owner', async () => {
      const entries = dataSource.getRepository(JournalEntry);

      await expect(
        entries.insert({
          id: 'entry-1',
          content: 'written with nobody to own it',
          createdAt: '2026-09-02T09:00:00.000Z',
        }),
      ).rejects.toThrow(/NOT NULL constraint failed: entries\.user_id/);
    });
  });

  describe('the shape an entry is read back in', () => {
    it('should carry no owner, because nothing has asked for one', async () => {
      const entries = dataSource.getRepository(JournalEntry);

      await dataSource.getRepository(User).insert({
        id: 'owner-of-entry-1',
        email: 'somebody@example.com',
        createdAt: '2026-09-01T00:00:00.000Z',
        passwordHash: null,
      });

      await entries.insert({
        id: 'entry-1',
        content: 'anything',
        createdAt: '2026-09-02T09:00:00.000Z',
        userId: 'owner-of-entry-1',
        dayId: await dayOf('owner-of-entry-1'),
      });

      const [found] = await entries.find();

      const serialized = JSON.parse(JSON.stringify(found)) as object;

      expect(Object.keys(serialized)).toEqual(['id', 'content', 'createdAt']);
    });
  });

  describe('ownership on write', () => {
    it('should record the caller as the owner of a new entry', async () => {
      await dataSource.getRepository(User).insert({
        id: 'owner-1',
        email: 'the-owner@example.com',
        createdAt: '2026-09-01T00:00:00.000Z',
        passwordHash: null,
      });

      const service = new EntriesService(
        new EntriesRepository(dataSource.getRepository(JournalEntry)),
        new DaysService(
          new DaysRepository(dataSource.getRepository(Day), dataSource),
        ),
        dataSource,
      );

      const created = await service.create('an owned entry', 'owner-1');

      const [row] = await dataSource.query<{ user_id: string | null }[]>(
        `SELECT user_id FROM entries WHERE id = '${created.id}'`,
      );
      expect(row.user_id).toBe('owner-1');

      expect(created.userId).toBeUndefined();
    });
  });
});
