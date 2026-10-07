import { DataSource } from 'typeorm';
import { entities } from '../database/entities';
import { migrations } from '../database/migrations';
import { Day } from './day.entity';
import { DaysRepository } from './days.repository';
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

    repository = new DaysRepository(dataSource.getRepository(Day));
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

  /*
   * The listing is asked through the repository, and the entries are written
   * with raw SQL, so that a deleted entry can be put in place without going
   * through the code that is being tested.
   */
  describe('findInRange', () => {
    const entryOn = (
      id: string,
      dayId: string,
      userId: string,
      deletedAt: string | null = null,
    ) =>
      dataSource.query(
        `INSERT INTO entries (id, content, created_at, user_id, day_id, deleted_at)
         VALUES (?, 'something', '2026-08-09T12:00:00.000Z', ?, ?, ?)`,
        [id, userId, dayId, deletedAt],
      );

    const datesListed = async (userId: string) =>
      (await repository.findInRange(userId, '2026-08-01', '2026-08-31')).map(
        (day) => day.date,
      );

    it('lists a day that has an entry', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('e1', day.id, 'alice');

      expect(await datesListed('alice')).toEqual(['2026-08-09']);
    });

    it('does not list a day that has only a mood', async () => {
      await repository.setMood('alice', '2026-08-09', 'Even');

      expect(await datesListed('alice')).toEqual([]);
    });

    it('does not list a day whose entries are all deleted', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('e1', day.id, 'alice', '2026-08-09T13:00:00.000Z');
      await entryOn('e2', day.id, 'alice', '2026-08-09T14:00:00.000Z');

      expect(await datesListed('alice')).toEqual([]);
    });

    it('lists a day once, however many entries it has', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('e1', day.id, 'alice');
      await entryOn('e2', day.id, 'alice');
      await entryOn('e3', day.id, 'alice', '2026-08-09T13:00:00.000Z');

      expect(await datesListed('alice')).toEqual(['2026-08-09']);
    });

    /*
     * This cannot happen through the API, which always files an entry under
     * the caller's own day. It is here because the subquery names the owner
     * of the entry, and nothing else would notice if it stopped.
     */
    it("does not list a day because of another user's entry on it", async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('bobs-entry', day.id, 'bob');

      expect(await datesListed('alice')).toEqual([]);
    });
  });
});
