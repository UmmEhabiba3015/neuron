import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedEntries,
  seedUser,
} from '../../test/test-database';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.entity';

const CALLER_ID = 'caller-id';

describe('EntriesService', () => {
  let service: EntriesService;
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, CALLER_ID);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,

        EntriesRepository,

        {
          provide: getRepositoryToken(JournalEntry),
          useValue: dataSource.getRepository(JournalEntry),
        },
      ],
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
      expect(await service.findAll()).toEqual([]);
    });

    it('should return an entry that was created', async () => {
      const created = await service.create(
        'a thought worth keeping',
        CALLER_ID,
      );

      expect(await service.findAll()).toContainEqual(created);
    });

    it('should return entries newest first', async () => {
      await seedEntries(dataSource, [
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
      ]);

      expect((await service.findAll()).map((entry) => entry.id)).toEqual([
        'newer',
        'older',
      ]);
    });
  });

  describe('create', () => {
    it('should return the entry it stored, with a server-generated id and timestamp', async () => {
      const created = await service.create(
        'the client supplied only this text',
        CALLER_ID,
      );

      expect(created.content).toBe('the client supplied only this text');

      expect(created.id.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    });

    it('should give each entry a distinct id', async () => {
      const a = await service.create('same text', CALLER_ID);
      const b = await service.create('same text', CALLER_ID);

      expect(a.id).not.toBe(b.id);
    });

    it('should store the content verbatim, including SQL syntax', async () => {
      const hostile = `'); DROP TABLE entries; --`;

      await service.create(hostile, CALLER_ID);

      expect((await service.findAll()).map((e) => e.content)).toEqual([
        hostile,
      ]);
    });
  });

  describe('create', () => {
    it('should store content verbatim, without trimming surrounding whitespace', async () => {
      const padded = '  spacing the user chose  ';

      const created = await service.create(padded, CALLER_ID);

      expect(created.content).toBe(padded);
      expect((await service.findById(created.id))?.content).toBe(padded);
    });
  });

  describe('findById', () => {
    it('should return the entry that was created', async () => {
      const created = await service.create('findable by its id', CALLER_ID);

      expect(await service.findById(created.id)).toEqual(created);
    });

    it('should return undefined when the id does not exist', async () => {
      expect(await service.findById('no-such-id')).toBeUndefined();
    });
  });

  describe('findByContent', () => {
    const seed = () =>
      seedEntries(dataSource, [
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
      ]);

    it('should return only the entries containing the word', async () => {
      await seed();

      expect(
        (await service.findByContent('work')).map((entry) => entry.id).sort(),
      ).toEqual(['newer-match', 'older-match']);
    });

    it('should return matching entries newest first', async () => {
      await seed();

      expect(
        (await service.findByContent('work')).map((entry) => entry.id),
      ).toEqual(['newer-match', 'older-match']);
    });

    it('should return an empty array when nothing matches', async () => {
      await seed();

      expect(await service.findByContent('zzz')).toEqual([]);
    });

    it('should return nothing for an empty search term', async () => {
      await seed();

      expect((await service.findAll()).length).toBeGreaterThan(0);
      expect(await service.findByContent('')).toEqual([]);
    });
  });

  describe('findByContent with characters the search engine treats specially', () => {
    const seedSpecialCharacters = () =>
      seedEntries(dataSource, [
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
      ]);

    it('should return only entries containing a literal percent sign', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.findByContent('%')).map((entry) => entry.id),
      ).toEqual(['has-percent']);
    });

    it('should return only entries containing a literal underscore', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.findByContent('_')).map((entry) => entry.id),
      ).toEqual(['has-underscore']);
    });

    it('should return only entries containing a literal backslash', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.findByContent('\\')).map((entry) => entry.id),
      ).toEqual(['has-backslash']);
    });

    it('should find an entry by a word that contains a percent sign', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.findByContent('100%')).map((entry) => entry.id),
      ).toEqual(['has-percent']);
    });
  });

  describe('update', () => {
    it('should change the content and leave the entry findable', async () => {
      const created = await service.create('the first draft', CALLER_ID);

      const updated = await service.update(created.id, 'the second draft');

      expect(updated?.content).toBe('the second draft');
      expect((await service.findById(created.id))?.content).toBe(
        'the second draft',
      );
    });

    it('should not change id or createdAt', async () => {
      const created = await service.create('written once', CALLER_ID);

      const updated = await service.update(created.id, 'edited later');

      expect(updated?.id).toBe(created.id);
      expect(updated?.createdAt).toBe(created.createdAt);
    });

    it('should store the new content verbatim, without trimming', async () => {
      const created = await service.create('before', CALLER_ID);
      const padded = '  the spacing the user chose  ';

      expect((await service.update(created.id, padded))?.content).toBe(padded);
      expect((await service.findById(created.id))?.content).toBe(padded);
    });

    it('should return undefined when the id does not exist', async () => {
      expect(await service.update('no-such-id', 'anything')).toBeUndefined();
    });

    it('should not create an entry for an id that does not exist', async () => {
      await service.update('no-such-id', 'anything');

      expect(await service.countEntries()).toBe(0);
    });
  });

  describe('delete', () => {
    it('should return the deleted entry and remove it', async () => {
      const created = await service.create('here for a moment', CALLER_ID);

      expect(await service.delete(created.id)).toEqual(created);
      expect(await service.findById(created.id)).toBeUndefined();
      expect(await service.countEntries()).toBe(0);
    });

    it('should leave other entries alone', async () => {
      const doomed = await service.create('the one being removed', CALLER_ID);
      const survivor = await service.create('the one that stays', CALLER_ID);

      await service.delete(doomed.id);

      expect(await service.findAll()).toEqual([survivor]);
    });

    it('should return undefined when the id does not exist', async () => {
      expect(await service.delete('no-such-id')).toBeUndefined();
    });
  });

  describe('countEntries', () => {
    it('should return zero for a fresh database', async () => {
      expect(await service.countEntries()).toBe(0);
    });

    it('should return the number of entries', async () => {
      await service.create('one', CALLER_ID);
      await service.create('two', CALLER_ID);
      await service.create('three', CALLER_ID);

      expect(await service.countEntries()).toBe(3);
    });
  });
});
