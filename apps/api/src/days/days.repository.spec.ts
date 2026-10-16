import { Mood } from '@neuron/contracts';
import { DataSource } from 'typeorm';
import { entities } from '../database/entities';
import { migrations } from '../database/migrations';
import { DayEntity } from './entities/day.entity';
import { DaysRepository } from './days.repository';
import { UserEntity } from '../users/entities/user.entity';
import { SEEDED_PASSWORD_HASH } from '../../test/support/test-database';

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
      await dataSource.getRepository(UserEntity).insert({
        id,
        email: `${id}@example.com`,
        createdAt: '2026-01-01T00:00:00.000Z',
        passwordHash: SEEDED_PASSWORD_HASH,
        name: 'Somebody',
        timezone: 'UTC',
      });
    }

    repository = new DaysRepository(dataSource.getRepository(DayEntity));
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

  describe('setMood', () => {
    const moodOf = async (userId: string) =>
      (await repository.findByDate(userId, '2026-08-09'))?.mood;

    it('creates the day with its mood, which is how a day exists without an entry', async () => {
      await repository.setMood('alice', '2026-08-09', Mood.Even);

      expect(await moodOf('alice')).toBe(Mood.Even);
    });

    it('replaces a mood rather than adding a second day', async () => {
      await repository.setMood('alice', '2026-08-09', Mood.Hard);
      await repository.setMood('alice', '2026-08-09', Mood.Good);

      expect(await moodOf('alice')).toBe(Mood.Good);
      const rows = await dataSource.query<{ c: number }[]>(
        'SELECT COUNT(*) AS c FROM days',
      );
      expect(Number(rows[0].c)).toBe(1);
    });

    it('clears a mood with null, and keeps the day', async () => {
      await repository.setMood('alice', '2026-08-09', Mood.Low);
      await repository.setMood('alice', '2026-08-09', null);

      expect(await repository.findByDate('alice', '2026-08-09')).toMatchObject({
        date: '2026-08-09',
        mood: null,
      });
    });

    it("never shows or changes another user's mood for the same date", async () => {
      await repository.setMood('alice', '2026-08-09', Mood.Hard);

      expect(await repository.findByDate('bob', '2026-08-09')).toBeUndefined();

      await repository.setMood('bob', '2026-08-09', Mood.Light);

      expect(await moodOf('alice')).toBe(Mood.Hard);
      expect(await moodOf('bob')).toBe(Mood.Light);
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

    it('lists the dates inside the range, both ends included, newest first, with their moods', async () => {
      for (const [date, mood] of [
        ['2026-07-31', Mood.Low],
        ['2026-08-01', Mood.Even],
        ['2026-08-15', Mood.Good],
        ['2026-08-31', Mood.Hard],
        ['2026-09-01', Mood.Light],
      ] as const) {
        const day = await repository.findOrCreate('alice', date);
        await entryOn(`entry-on-${date}`, day.id, 'alice');
        await repository.setMood('alice', date, mood);
      }

      expect(
        (await repository.findInRange('alice', '2026-08-01', '2026-08-31')).map(
          ({ date, mood }) => ({ date, mood }),
        ),
      ).toEqual([
        { date: '2026-08-31', mood: 'Hard' },
        { date: '2026-08-15', mood: 'Good' },
        { date: '2026-08-01', mood: 'Even' },
      ]);
      expect(
        await repository.findInRange('alice', '2026-08-01', '2026-08-01'),
      ).toHaveLength(1);
      expect(
        await repository.findInRange('alice', '2025-01-01', '2025-12-31'),
      ).toEqual([]);
      expect(
        await repository.findInRange('bob', '2026-01-01', '2026-12-31'),
      ).toEqual([]);
    });

    it('lists a date again, with the mood it kept, once a live entry is on it again', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await repository.setMood('alice', '2026-08-09', Mood.Low);
      await entryOn('gone', day.id, 'alice', '2026-08-09T13:00:00.000Z');
      expect(await datesListed('alice')).toEqual([]);

      await entryOn('back', day.id, 'alice');

      expect(
        (await repository.findInRange('alice', '2026-08-01', '2026-08-31')).map(
          ({ date, mood }) => ({ date, mood }),
        ),
      ).toEqual([{ date: '2026-08-09', mood: 'Low' }]);
    });

    it('lists a day that has an entry', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('e1', day.id, 'alice');

      expect(await datesListed('alice')).toEqual(['2026-08-09']);
    });

    it('does not list a day that has only a mood', async () => {
      await repository.setMood('alice', '2026-08-09', Mood.Even);

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

  describe('hasLiveEntry', () => {
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

    it('is true for a date with an entry that is not deleted', async () => {
      const day = await repository.findOrCreate('alice', '2026-08-09');
      await entryOn('e1', day.id, 'alice', '2026-08-09T13:00:00.000Z');
      await entryOn('e2', day.id, 'alice');

      expect(await repository.hasLiveEntry('alice', '2026-08-09')).toBe(true);
    });

    it('is false for no day, a day with only a mood, and a day whose entries are all deleted', async () => {
      expect(await repository.hasLiveEntry('alice', '2026-08-09')).toBe(false);

      await repository.setMood('alice', '2026-08-10', Mood.Even);
      expect(await repository.hasLiveEntry('alice', '2026-08-10')).toBe(false);

      const day = await repository.findOrCreate('alice', '2026-08-11');
      await entryOn('gone', day.id, 'alice', '2026-08-11T13:00:00.000Z');
      expect(await repository.hasLiveEntry('alice', '2026-08-11')).toBe(false);
    });

    it("is false for another person's date, and for another person's entry on one's own day", async () => {
      const bobs = await repository.findOrCreate('bob', '2026-08-09');
      await entryOn('bobs-entry', bobs.id, 'bob');
      expect(await repository.hasLiveEntry('alice', '2026-08-09')).toBe(false);

      const alices = await repository.findOrCreate('alice', '2026-08-12');
      await entryOn('misfiled', alices.id, 'bob');
      expect(await repository.hasLiveEntry('alice', '2026-08-12')).toBe(false);
    });
  });
});
