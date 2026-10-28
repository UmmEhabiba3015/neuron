import { Test } from '@nestjs/testing';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedUser,
  SEEDED_TIMEZONE,
} from '../../test/support/test-database';
import { entriesProviders } from '../../test/support/entries-providers';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';

/*
 * Keep out of memory (features.md, Ref 25). The mark is chosen when an entry
 * is saved, and goes one way: an entry kept out can be put in memory, and
 * nothing keeps an entry out once it is in.
 */
describe('keep out of memory', () => {
  const ALICE = { id: 'alice', timezone: SEEDED_TIMEZONE };
  const BOB = { id: 'bob', timezone: SEEDED_TIMEZONE };
  const RECORDING = { bytes: Buffer.from('bytes'), type: 'audio/webm' };

  let dataSource: DataSource;
  let service: EntriesService;
  let repository: EntriesRepository;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, ALICE.id);
    await seedUser(dataSource, BOB.id);

    const module = await Test.createTestingModule({
      providers: entriesProviders(dataSource),
    }).compile();

    service = module.get(EntriesService);
    repository = module.get(EntriesRepository);
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  const markOf = async (id: string) =>
    (
      await dataSource.query<{ kept_out_of_memory: boolean }[]>(
        'SELECT kept_out_of_memory FROM entries WHERE id = $1',
        [id],
      )
    )[0].kept_out_of_memory;

  describe('when an entry is saved', () => {
    it('is in memory unless the person chose otherwise, typed or memo', async () => {
      const typed = await service.create('ordinary', ALICE);
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);

      expect(typed.keptOutOfMemory).toBe(false);
      expect(memo.keptOutOfMemory).toBe(false);
      expect(await markOf(typed.id)).toBe(false);
      expect(await markOf(memo.id)).toBe(false);
    });

    it('is kept out when the person ticked it, typed or memo', async () => {
      const typed = await service.create('private', ALICE, true);
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE, true);

      expect(typed.keptOutOfMemory).toBe(true);
      expect(memo.keptOutOfMemory).toBe(true);
      expect(await markOf(typed.id)).toBe(true);
      expect(await markOf(memo.id)).toBe(true);
    });

    it('is still found by a search when kept out', async () => {
      const typed = await service.create('a private walk', ALICE, true);

      expect(
        (await service.find(ALICE.id, { word: 'walk' })).map((e) => e.id),
      ).toEqual([typed.id]);
    });
  });

  describe('putInMemory', () => {
    it('puts a kept-out entry in memory, typed or memo, and answers with it', async () => {
      const typed = await service.create('private', ALICE, true);
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE, true);

      for (const entry of [typed, memo]) {
        const answered = await repository.putInMemory(entry.id, ALICE.id);

        expect(answered).toEqual({ ...entry, keptOutOfMemory: false });
        expect(await markOf(entry.id)).toBe(false);
      }
    });

    it('leaves an entry in memory in memory, and answers the same', async () => {
      const typed = await service.create('ordinary', ALICE);

      const first = await repository.putInMemory(typed.id, ALICE.id);
      const second = await repository.putInMemory(typed.id, ALICE.id);

      expect(first).toEqual(typed);
      expect(second).toEqual(typed);
    });

    it("finds nothing of another person's, and leaves it kept out", async () => {
      const alices = await service.create('private', ALICE, true);

      expect(await repository.putInMemory(alices.id, BOB.id)).toBeUndefined();
      expect(await markOf(alices.id)).toBe(true);
    });

    it('finds nothing deleted, and leaves it kept out', async () => {
      const typed = await service.create('private', ALICE, true);
      await service.delete(typed.id, ALICE.id);

      expect(await repository.putInMemory(typed.id, ALICE.id)).toBeUndefined();
      expect(await markOf(typed.id)).toBe(true);
    });

    it('finds nothing for an id that does not exist', async () => {
      expect(
        await service.putInMemory(crypto.randomUUID(), ALICE.id),
      ).toBeUndefined();
    });
  });

  describe('after an entry is saved', () => {
    it('no write sets the mark to true: not an edit, not putInMemory', async () => {
      const typed = await service.create('ordinary', ALICE);
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);

      await service.update(typed.id, 'edited', ALICE.id);
      await service.update(memo.id, 'refused', ALICE.id);
      await service.putInMemory(typed.id, ALICE.id);
      await service.putInMemory(memo.id, ALICE.id);

      expect(await markOf(typed.id)).toBe(false);
      expect(await markOf(memo.id)).toBe(false);
    });

    it('an edit leaves a kept-out entry kept out', async () => {
      const typed = await service.create('private', ALICE, true);

      await service.update(typed.id, 'edited', ALICE.id);

      expect(await markOf(typed.id)).toBe(true);
    });
  });
});
