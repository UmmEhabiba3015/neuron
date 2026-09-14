import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedUser,
} from '../../test/test-database';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { JournalEntry } from './entry.entity';

const CALLER_ID = 'caller-id';

const caller = {
  user: { id: CALLER_ID },
} as unknown as AuthenticatedRequest;

describe('EntriesController', () => {
  let controller: EntriesController;
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, CALLER_ID);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        EntriesService,
        EntriesRepository,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: dataSource.getRepository(JournalEntry),
        },
      ],
    })

      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EntriesController>(EntriesController);
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return entries that each satisfy the JournalEntry contract', async () => {
      await controller.create(
        {
          content: 'an entry to have something to assert on',
        },
        caller,
      );

      const result = await controller.findAll({});

      expect(result.length).toBeGreaterThan(0);

      for (const entry of result) {
        expect(entry.id.length).toBeGreaterThan(0);
        expect(entry.content.length).toBeGreaterThan(0);

        expect(Number.isNaN(Date.parse(entry.createdAt))).toBe(false);
      }
    });
  });

  describe('create', () => {
    it('should return the created entry rather than nothing', async () => {
      const created = await controller.create(
        {
          content: 'returned to the client',
        },
        caller,
      );

      expect(created.content).toBe('returned to the client');

      expect(created.id.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    });

    it('should hand the created entry to findAll', async () => {
      const created = await controller.create(
        {
          content: 'should be readable back',
        },
        caller,
      );

      expect(await controller.findAll({})).toContainEqual(created);
    });

    it('should store valid content verbatim, without trimming', async () => {
      const padded = '  the user chose this spacing  ';

      expect(
        (await controller.create({ content: padded }, caller)).content,
      ).toBe(padded);
    });
  });

  describe('findById', () => {
    it('should return the entry that was created', async () => {
      const created = await controller.create(
        {
          content: 'findable by its id',
        },
        caller,
      );

      expect(await controller.findById(created.id)).toEqual(created);
    });

    it('should throw NotFoundException when the id does not exist', async () => {
      await expect(controller.findById('no-such-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll by word', () => {
    it('should return an empty array when nothing matches', async () => {
      await controller.create({ content: 'quiet evening at home' }, caller);

      expect(await controller.findAll({ word: 'zzzzz' })).toEqual([]);
    });

    it('should list everything for an absent word and nothing for an empty one', async () => {
      const created = await controller.create(
        {
          content: 'quiet evening at home',
        },
        caller,
      );

      expect(await controller.findAll({})).toEqual([created]);
      expect(await controller.findAll({ word: '' })).toEqual([]);
    });
  });

  describe('update', () => {
    it('should return the entry with its new content', async () => {
      const created = await controller.create(
        { content: 'the first draft' },
        caller,
      );

      const updated = await controller.update(created.id, {
        content: 'the second draft',
      });

      expect(updated.content).toBe('the second draft');
      expect((await controller.findById(created.id)).content).toBe(
        'the second draft',
      );
    });

    it('should leave createdAt unchanged', async () => {
      const created = await controller.create(
        { content: 'written once' },
        caller,
      );

      const updated = await controller.update(created.id, {
        content: 'edited later',
      });

      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('should throw NotFoundException when the id does not exist', async () => {
      await expect(
        controller.update('no-such-id', { content: 'anything' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should return the deleted entry and leave it gone', async () => {
      const created = await controller.create(
        { content: 'here for a moment' },
        caller,
      );

      expect(await controller.delete(created.id)).toEqual(created);
      await expect(controller.findById(created.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the id does not exist', async () => {
      await expect(controller.delete('no-such-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not report success twice for the same entry', async () => {
      const created = await controller.create(
        { content: 'deleted once' },
        caller,
      );

      await controller.delete(created.id);

      await expect(controller.delete(created.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('countEntries', () => {
    it('should return the count wrapped in an object', async () => {
      expect(await controller.countEntries()).toEqual({ count: 0 });

      await controller.create({ content: 'one' }, caller);
      await controller.create({ content: 'two' }, caller);

      expect(await controller.countEntries()).toEqual({ count: 2 });
    });
  });
});
