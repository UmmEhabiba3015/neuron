import { DataSource } from 'typeorm';
import { entities } from '../database/entities';
import { migrations } from '../database/migrations';
import { Day } from './day.entity';
import { DaysRepository } from './days.repository';
import { JournalEntry } from '../entries/entry.entity';
import { User } from '../users/user.entity';

describe('DaysRepository', () => {
  let dataSource: DataSource;
  let repository: DaysRepository;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities,
      migrations,
      synchronize: false,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    for (const id of ['alice', 'bob']) {
      await dataSource.getRepository(User).insert({
        id,
        email: `${id}@example.com`,
        createdAt: '2026-01-01T00:00:00.000Z',
        passwordHash: null,
      });
    }

    repository = new DaysRepository(dataSource.getRepository(Day), dataSource);
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('findOrCreate', () => {
    it('creates the day once and returns the same row afterwards', async () => {
      const first = await repository.findOrCreate('alice', '2026-08-09');
      const second = await repository.findOrCreate('alice', '2026-08-09');

      expect(second.id).toBe(first.id);

      const rows = await dataSource.query<{ c: number }[]>(
        'SELECT COUNT(*) AS c FROM days',
      );
      expect(Number(rows[0].c)).toBe(1);
    });

    it('gives two users their own row for the same date', async () => {
      const alice = await repository.findOrCreate('alice', '2026-08-09');
      const bob = await repository.findOrCreate('bob', '2026-08-09');

      expect(bob.id).not.toBe(alice.id);
    });

    /*
     * The loser of the race reads back the winner's row rather than failing.
     * Inserting the row behind the repository's back is what makes the
     * pre-check stale, which is the state a concurrent writer would see.
     */
    it('returns the existing row when the insert loses to a unique violation', async () => {
      await dataSource.query(
        `INSERT INTO days (id, date, mood, created_at, user_id)
         VALUES ('winner', '2026-08-09', 'Even', '2026-08-09T00:00:00.000Z', 'alice')`,
      );

      const day = await repository.findOrCreate('alice', '2026-08-09');

      expect(day.id).toBe('winner');
      expect(day.mood).toBe('Even');
    });
  });

  describe('deleteIfEmpty', () => {
    const entryOn = (id: string, dayId: string, userId: string) =>
      dataSource.getRepository(JournalEntry).insert({
        id,
        content: 'something',
        createdAt: '2026-08-09T12:00:00.000Z',
        userId,
        dayId,
      });

    it('deletes a day with nothing on it', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');

      expect(await repository.deleteIfEmpty(day.id, 'alice')).toBe(true);
      expect(
        await repository.findByDate('alice', '2026-08-09'),
      ).toBeUndefined();
    });

    it('keeps a day that still has an entry', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('alice-entry', day.id, 'alice');

      expect(await repository.deleteIfEmpty(day.id, 'alice')).toBe(false);
    });

    /*
     * The count has to be scoped by user as well as by day. Scoped only by
     * day_id, another user's row on the same day keeps this one alive --
     * ownership living in the caller rather than in the WHERE clause, which
     * is what ADR-013 refused.
     */
    it("ignores another user's entry when deciding the day is empty", async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('bobs-entry', day.id, 'bob');

      expect(await repository.deleteIfEmpty(day.id, 'alice')).toBe(true);
    });

    it("refuses to delete another user's day", async () => {
      const day = await repository.findOrCreate('bob', '2026-08-09');

      expect(await repository.deleteIfEmpty(day.id, 'alice')).toBe(false);
      expect(await repository.findByDate('bob', '2026-08-09')).toBeDefined();
    });
  });
});
