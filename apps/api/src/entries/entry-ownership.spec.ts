import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  SEEDED_PASSWORD_HASH,
} from '../../test/support/test-database';
import { UserEntity } from '../users/entities/user.entity';
import { DayEntity } from '../days/entities/day.entity';
import { DaysRepository } from '../days/days.repository';
import { DaysService } from '../days/days.service';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { EntryEntity } from './entities/entry.entity';
import { temporaryAudioStorage } from '../../test/support/entries-providers';

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
    const days = new DaysRepository(dataSource.getRepository(DayEntity));

    return (await days.findOrCreate(userId, '2026-09-02')).id;
  };

  const columnsOf = (table: string) =>
    dataSource.query<{ name: string; type: string; notnull: boolean }[]>(
      `SELECT column_name AS name, data_type AS type,
              is_nullable = 'NO' AS notnull
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position`,
      [table],
    );

  describe('the users table', () => {
    it('should have exactly id, email, created_at, password_hash, name and timezone', async () => {
      expect((await columnsOf('users')).map((column) => column.name)).toEqual([
        'id',
        'email',
        'created_at',
        'password_hash',
        'name',
        'timezone',
      ]);
    });

    it('should store the credential as one column and never a plaintext password', async () => {
      const names = (await columnsOf('users')).map((column) => column.name);

      expect(names).toContain('password_hash');
      expect(names).not.toContain('password');
      expect(names).not.toContain('salt');
    });

    it('should require the credential, since every account has one', async () => {
      const passwordHash = (await columnsOf('users')).find(
        (column) => column.name === 'password_hash',
      );

      expect(passwordHash?.notnull).toBe(true);
    });

    it('should require names to be unique', async () => {
      const users = dataSource.getRepository(UserEntity);

      await users.insert({
        id: 'user-1',
        email: 'habiba@example.com',
        createdAt: '2026-09-02T09:00:00.000Z',
        passwordHash: SEEDED_PASSWORD_HASH,
        name: 'Somebody',
        timezone: 'UTC',
      });

      await expect(
        users.insert({
          id: 'user-2',
          email: 'habiba@example.com',
          createdAt: '2026-09-02T09:00:01.000Z',
          passwordHash: SEEDED_PASSWORD_HASH,
          name: 'Somebody',
          timezone: 'UTC',
        }),
      ).rejects.toThrow(/duplicate key value violates unique constraint/);
    });
  });

  describe('the user_id column on entries', () => {
    it('should exist and require an owner', async () => {
      const userId = (await columnsOf('entries')).find(
        (column) => column.name === 'user_id',
      );

      expect(userId).toBeDefined();
      expect(userId?.type).toBe('text');

      expect(userId?.notnull).toBe(true);
    });

    it('should be a foreign key pointing at users.id', async () => {
      const foreignKeys = await dataSource.query<
        { table: string; from: string; to: string }[]
      >(
        `SELECT target.table_name AS table, source.column_name AS from,
                target.column_name AS to
           FROM information_schema.table_constraints AS constraints
           JOIN information_schema.key_column_usage AS source
             ON source.constraint_name = constraints.constraint_name
           JOIN information_schema.constraint_column_usage AS target
             ON target.constraint_name = constraints.constraint_name
          WHERE constraints.table_name = 'entries'
            AND constraints.constraint_type = 'FOREIGN KEY'`,
      );

      expect(foreignKeys).toContainEqual(
        expect.objectContaining({ table: 'users', from: 'user_id', to: 'id' }),
      );
    });

    it('should actually be enforced, not merely declared', async () => {
      await dataSource.getRepository(UserEntity).insert({
        id: 'user-1',
        email: 'habiba@example.com',
        createdAt: '2026-09-02T09:00:00.000Z',
        passwordHash: SEEDED_PASSWORD_HASH,
        name: 'Somebody',
        timezone: 'UTC',
      });

      await expect(
        dataSource.getRepository(EntryEntity).insert({
          id: 'entry-1',
          content: 'owned by nobody who exists',
          createdAt: '2026-09-02T09:00:00.000Z',
          userId: 'no-such-user',
          dayId: await dayOf('user-1'),
        }),
      ).rejects.toThrow(/violates foreign key constraint "FK_entries_user"/);
    });
  });

  describe('writing and reading an owner', () => {
    it('should round-trip an owner through the entity', async () => {
      await dataSource.getRepository(UserEntity).insert({
        id: 'user-1',
        email: 'habiba@example.com',
        createdAt: '2026-09-02T09:00:00.000Z',
        passwordHash: SEEDED_PASSWORD_HASH,
        name: 'Somebody',
        timezone: 'UTC',
      });

      const entries = dataSource.getRepository(EntryEntity);

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
      const entries = dataSource.getRepository(EntryEntity);

      await expect(
        entries.insert({
          id: 'entry-1',
          content: 'written with nobody to own it',
          createdAt: '2026-09-02T09:00:00.000Z',
        }),
      ).rejects.toThrow(/null value in column "user_id" of relation "entries"/);
    });
  });

  describe('the shape an entry is read back in', () => {
    it('should carry no owner, because nothing has asked for one', async () => {
      const entries = dataSource.getRepository(EntryEntity);

      await dataSource.getRepository(UserEntity).insert({
        id: 'owner-of-entry-1',
        email: 'somebody@example.com',
        createdAt: '2026-09-01T00:00:00.000Z',
        passwordHash: SEEDED_PASSWORD_HASH,
        name: 'Somebody',
        timezone: 'UTC',
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

      /* Nor a voice memo's audio key or type, which are not read either. */
      expect(Object.keys(serialized)).toEqual([
        'id',
        'kind',
        'content',
        'durationMs',
        'createdAt',
        'keptOutOfMemory',
      ]);
    });
  });

  describe('ownership on write', () => {
    it('should record the caller as the owner of a new entry', async () => {
      await dataSource.getRepository(UserEntity).insert({
        id: 'owner-1',
        email: 'the-owner@example.com',
        createdAt: '2026-09-01T00:00:00.000Z',
        passwordHash: SEEDED_PASSWORD_HASH,
        name: 'Somebody',
        timezone: 'UTC',
      });

      const service = new EntriesService(
        new EntriesRepository(dataSource.getRepository(EntryEntity)),
        new DaysService(
          new DaysRepository(dataSource.getRepository(DayEntity)),
        ),
        dataSource,
        temporaryAudioStorage(),
      );

      const created = await service.create('an owned entry', {
        id: 'owner-1',
        timezone: 'UTC',
      });

      const [row] = await dataSource.query<{ user_id: string | null }[]>(
        `SELECT user_id FROM entries WHERE id = '${created.id}'`,
      );
      expect(row.user_id).toBe('owner-1');

      expect(created.userId).toBeUndefined();
    });
  });
});
