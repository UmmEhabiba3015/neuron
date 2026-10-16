import { Test, TestingModule } from '@nestjs/testing';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedEntries,
  seedUser,
  SEEDED_TIMEZONE,
} from '../../test/support/test-database';
import { EntriesService } from './entries.service';
import type { UpdateOutcome } from './types/update-outcome.type';
import { entriesProviders } from '../../test/support/entries-providers';
import { freezeClockAt, releaseClock } from '../../test/support/clock';

const CALLER_ID = 'caller-id';

const updatedEntry = (outcome: UpdateOutcome) => {
  if (outcome.status !== 'updated') {
    throw new Error(`expected the entry to be updated, got ${outcome.status}`);
  }

  return outcome.entry;
};

/* create() takes the author with their timezone. seedUser stores the same zone. */
const CALLER = { id: CALLER_ID, timezone: SEEDED_TIMEZONE };

describe('EntriesService', () => {
  let service: EntriesService;
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, CALLER_ID);

    const module: TestingModule = await Test.createTestingModule({
      providers: entriesProviders(dataSource),
    }).compile();

    service = module.get<EntriesService>(EntriesService);
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return nothing for a fresh database', async () => {
      expect(await service.find(CALLER_ID)).toEqual([]);
    });

    it('should return an entry that was created', async () => {
      const created = await service.create('a thought worth keeping', CALLER);

      expect(await service.find(CALLER_ID)).toContainEqual(created);
    });

    it('should return entries newest first', async () => {
      await seedEntries(
        dataSource,
        [
          {
            id: 'older',
            content: 'written first',
            createdAt: '2026-07-28T09:00:00.000Z',
          },
          {
            id: 'newer',
            content: 'written second',
            createdAt: '2026-07-29T09:00:00.000Z',
          },
        ],
        CALLER_ID,
      );

      expect((await service.find(CALLER_ID)).map((entry) => entry.id)).toEqual([
        'newer',
        'older',
      ]);
    });
  });

  describe('create', () => {
    it('should return the entry it stored, with a server-generated id and timestamp', async () => {
      const created = await service.create(
        'the client supplied only this text',
        CALLER,
      );

      expect(created.content).toBe('the client supplied only this text');

      expect(created.id.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    });

    it('should give each entry a distinct id', async () => {
      const a = await service.create('same text', CALLER);
      const b = await service.create('same text', CALLER);

      expect(a.id).not.toBe(b.id);
    });

    it('should store the content verbatim, including SQL syntax', async () => {
      const hostile = `'); DROP TABLE entries; --`;

      await service.create(hostile, CALLER);

      expect((await service.find(CALLER_ID)).map((e) => e.content)).toEqual([
        hostile,
      ]);
    });
  });

  describe('create', () => {
    it('should store content verbatim, without trimming surrounding whitespace', async () => {
      const padded = '  spacing the user chose  ';

      const created = await service.create(padded, CALLER);

      expect(created.content).toBe(padded);
      expect((await service.findById(created.id, CALLER_ID))?.content).toBe(
        padded,
      );
    });
  });

  describe('findById', () => {
    it('should return the entry that was created', async () => {
      const created = await service.create('findable by its id', CALLER);

      expect(await service.findById(created.id, CALLER_ID)).toEqual(created);
    });

    it('should return undefined when the id does not exist', async () => {
      expect(await service.findById('no-such-id', CALLER_ID)).toBeUndefined();
    });
  });

  describe('findByContent', () => {
    const seed = () =>
      seedEntries(
        dataSource,
        [
          {
            id: 'older-match',
            content: 'felt overwhelmed at work',
            createdAt: '2026-07-28T09:00:00.000Z',
          },
          {
            id: 'no-match',
            content: 'quiet evening at home',
            createdAt: '2026-07-29T09:00:00.000Z',
          },
          {
            id: 'newer-match',
            content: 'back at work again',
            createdAt: '2026-07-30T09:00:00.000Z',
          },
        ],
        CALLER_ID,
      );

    it('should return only the entries containing the word', async () => {
      await seed();

      expect(
        (await service.find(CALLER_ID, { word: 'work' }))
          .map((entry) => entry.id)
          .sort(),
      ).toEqual(['newer-match', 'older-match']);
    });

    it('should return matching entries newest first', async () => {
      await seed();

      expect(
        (await service.find(CALLER_ID, { word: 'work' })).map(
          (entry) => entry.id,
        ),
      ).toEqual(['newer-match', 'older-match']);
    });

    it('should return an empty array when nothing matches', async () => {
      await seed();

      expect(await service.find(CALLER_ID, { word: 'zzz' })).toEqual([]);
    });

    it('should return nothing for an empty search term', async () => {
      await seed();

      expect((await service.find(CALLER_ID)).length).toBeGreaterThan(0);
      expect(await service.find(CALLER_ID, { word: '' })).toEqual([]);
    });
  });

  describe('findByContent with characters the search engine treats specially', () => {
    const seedSpecialCharacters = () =>
      seedEntries(
        dataSource,
        [
          {
            id: 'has-percent',
            content: '100% exhausted today',
            createdAt: '2026-07-28T09:00:00.000Z',
          },
          {
            id: 'has-underscore',
            content: 'named the file snake_case',
            createdAt: '2026-07-29T09:00:00.000Z',
          },

          {
            id: 'has-backslash',
            content: 'the path was C:\\temp',
            createdAt: '2026-07-30T09:00:00.000Z',
          },
          {
            id: 'has-none',
            content: 'an ordinary quiet evening',
            createdAt: '2026-07-31T09:00:00.000Z',
          },
        ],
        CALLER_ID,
      );

    it('should return only entries containing a literal percent sign', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.find(CALLER_ID, { word: '%' })).map((entry) => entry.id),
      ).toEqual(['has-percent']);
    });

    it('should return only entries containing a literal underscore', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.find(CALLER_ID, { word: '_' })).map((entry) => entry.id),
      ).toEqual(['has-underscore']);
    });

    it('should return only entries containing a literal backslash', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.find(CALLER_ID, { word: '\\' })).map(
          (entry) => entry.id,
        ),
      ).toEqual(['has-backslash']);
    });

    it('should find an entry by a word that contains a percent sign', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.find(CALLER_ID, { word: '100%' })).map(
          (entry) => entry.id,
        ),
      ).toEqual(['has-percent']);
    });
  });

  describe('update', () => {
    it('should change the content and leave the entry findable', async () => {
      const created = await service.create('the first draft', CALLER);

      const updated = await service.update(
        created.id,
        'the second draft',
        CALLER_ID,
      );

      expect(updatedEntry(updated).content).toBe('the second draft');
      expect((await service.findById(created.id, CALLER_ID))?.content).toBe(
        'the second draft',
      );
    });

    it('should not change id or createdAt', async () => {
      const created = await service.create('written once', CALLER);

      const updated = await service.update(
        created.id,
        'edited later',
        CALLER_ID,
      );

      expect(updatedEntry(updated).id).toBe(created.id);
      expect(updatedEntry(updated).createdAt).toBe(created.createdAt);
    });

    it('should store the new content verbatim, without trimming', async () => {
      const created = await service.create('before', CALLER);
      const padded = '  the spacing the user chose  ';

      expect(
        updatedEntry(await service.update(created.id, padded, CALLER_ID))
          .content,
      ).toBe(padded);
      expect((await service.findById(created.id, CALLER_ID))?.content).toBe(
        padded,
      );
    });

    it('should say not found when the id does not exist', async () => {
      expect(await service.update('no-such-id', 'anything', CALLER_ID)).toEqual(
        { status: 'notFound' },
      );
    });

    it('should not create an entry for an id that does not exist', async () => {
      await service.update('no-such-id', 'anything', CALLER_ID);

      expect(await service.count(CALLER_ID)).toBe(0);
    });
  });

  describe('delete', () => {
    it('should say it deleted the entry, which is then gone', async () => {
      const created = await service.create('here for a moment', CALLER);

      expect(await service.delete(created.id, CALLER_ID)).toBe(true);
      expect(await service.findById(created.id, CALLER_ID)).toBeUndefined();
      expect(await service.count(CALLER_ID)).toBe(0);
    });

    it('should leave other entries alone', async () => {
      const doomed = await service.create('the one being removed', CALLER);
      const survivor = await service.create('the one that stays', CALLER);

      await service.delete(doomed.id, CALLER_ID);

      expect(await service.find(CALLER_ID)).toEqual([survivor]);
    });

    it('should say it deleted nothing when the id does not exist', async () => {
      expect(await service.delete('no-such-id', CALLER_ID)).toBe(false);
    });
  });

  describe('countEntries', () => {
    it('should return zero for a fresh database', async () => {
      expect(await service.count(CALLER_ID)).toBe(0);
    });

    it('should return the number of entries', async () => {
      await service.create('one', CALLER);
      await service.create('two', CALLER);
      await service.create('three', CALLER);

      expect(await service.count(CALLER_ID)).toBe(3);
    });
  });

  /*
   * Writing an entry files it under a day, creating the day the first time.
   * Deleting one leaves the day alone, mood included: an emptied day is kept
   * off the calendar by the range listing, not by removing its row.
   */
  describe('the day of an entry', () => {
    const dayRows = () =>
      dataSource.query<{ id: string; date: string; mood: string | null }[]>(
        'SELECT id, date, mood FROM days ORDER BY date',
      );

    afterEach(() => {
      releaseClock();
    });

    it('is created once, for several entries written the same day', async () => {
      await service.create('first', CALLER);
      await service.create('second', CALLER);
      await service.create('third', CALLER);

      expect(await dayRows()).toHaveLength(1);
    });

    it("is the author's own, even when another person writes on the same date", async () => {
      await seedUser(dataSource, 'someone-else');

      await service.create('mine', CALLER);
      await service.create('theirs', { id: 'someone-else', timezone: 'UTC' });

      expect(await dayRows()).toHaveLength(2);
    });

    /* 05:00Z on 8 October is still the 7th in Los Angeles. */
    it("is the date in the author's timezone, not in UTC", async () => {
      freezeClockAt('2026-10-08T05:00:00.000Z');

      const created = await service.create('ten at night', {
        id: CALLER_ID,
        timezone: 'America/Los_Angeles',
      });

      expect(created.createdAt).toBe('2026-10-08T05:00:00.000Z');
      expect(created.day.date).toBe('2026-10-07');
    });

    it('stays, with its mood, when its last entry is deleted, and takes the next entry', async () => {
      const only = await service.create('the only one', CALLER);
      const [day] = await dayRows();
      await dataSource.query('UPDATE days SET mood = ? WHERE id = ?', [
        'Good',
        day.id,
      ]);

      await service.delete(only.id, CALLER_ID);

      expect(await dayRows()).toEqual([{ ...day, mood: 'Good' }]);

      const next = await service.create('written after', CALLER);
      const [row] = await dataSource.query<{ day_id: string }[]>(
        'SELECT day_id FROM entries WHERE id = ?',
        [next.id],
      );

      expect(row.day_id).toBe(day.id);
      expect(await dayRows()).toEqual([{ ...day, mood: 'Good' }]);
    });
  });
});
