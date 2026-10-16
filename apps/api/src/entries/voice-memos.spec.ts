import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { EntryKind } from '@neuron/contracts';
import { EntityManager, type DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedUser,
  SEEDED_TIMEZONE,
} from '../../test/support/test-database';
import { entriesProviders } from '../../test/support/entries-providers';
import { freezeClockAt, releaseClock } from '../../test/support/clock';
import { AudioStorage } from './audio-storage';
import { EntriesService } from './entries.service';
import { EntryEntity } from './entities/entry.entity';

/*
 * A voice memo through EntriesService, on a real database and a real folder:
 * the order of the two writes (ADR-023), who may hear it (ADR-013), that a
 * deleted or typed entry has no audio (ADR-020), that it is filed on the
 * author's day (ADR-015), and that it cannot be edited (Ref 11).
 */
describe('voice memos (EntriesService)', () => {
  const ALICE = { id: 'alice', timezone: SEEDED_TIMEZONE };
  const BOB = { id: 'bob', timezone: SEEDED_TIMEZONE };
  const RECORDING = {
    bytes: Buffer.from('not really opus, but bytes all the same'),
    type: 'audio/webm;codecs=opus',
  };

  let dataSource: DataSource;
  let folder: string;
  let storage: AudioStorage;
  let service: EntriesService;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, ALICE.id);
    await seedUser(dataSource, BOB.id);

    folder = mkdtempSync(join(tmpdir(), 'neuron-voice-memos-'));
    storage = new AudioStorage(folder);

    const module = await Test.createTestingModule({
      providers: entriesProviders(dataSource, storage),
    }).compile();

    service = module.get(EntriesService);
  });

  afterEach(async () => {
    releaseClock();
    jest.restoreAllMocks();
    await closeTestDataSource(dataSource);
    rmSync(folder, { recursive: true, force: true });
  });

  const rows = () =>
    dataSource.query<Record<string, unknown>[]>(
      `SELECT id, kind, content, audio_key, audio_type, duration_ms FROM entries`,
    );

  const filesInFolder = () => readdirSync(folder);

  describe('createVoiceMemo', () => {
    it('answers a memo with no words, its length and the date of its day', async () => {
      const memo = await service.createVoiceMemo(RECORDING, 72_000, ALICE);

      expect(memo).toMatchObject({
        kind: EntryKind.Voice,
        content: null,
        durationMs: 72_000,
      });
      expect(memo.day.date).toBe(memo.createdAt.slice(0, 10));
    });

    it('keeps the bytes in a file named by a new random id, which the row holds with the type as sent', async () => {
      const memo = await service.createVoiceMemo(RECORDING, 72_000, ALICE);

      const [file] = filesInFolder();
      expect(filesInFolder()).toHaveLength(1);
      expect(file).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
      expect(file).not.toBe(memo.id);
      expect(readFileSync(join(folder, file))).toEqual(RECORDING.bytes);

      expect(await rows()).toEqual([
        {
          id: memo.id,
          kind: 'Voice',
          content: null,
          audio_key: file,
          audio_type: 'audio/webm;codecs=opus',
          duration_ms: 72_000,
        },
      ]);
    });

    /* 05:00Z on 8 October is still the 7th in Los Angeles. */
    it("is filed on the author's day, in the author's timezone", async () => {
      freezeClockAt('2026-10-08T05:00:00.000Z');

      const memo = await service.createVoiceMemo(RECORDING, 1_000, {
        id: ALICE.id,
        timezone: 'America/Los_Angeles',
      });

      expect(memo.createdAt).toBe('2026-10-08T05:00:00.000Z');
      expect(memo.day.date).toBe('2026-10-07');
    });

    it('writes no row when the file cannot be written', async () => {
      jest
        .spyOn(storage, 'write')
        .mockRejectedValue(new Error('the disk is full'));

      await expect(
        service.createVoiceMemo(RECORDING, 1_000, ALICE),
      ).rejects.toThrow('the disk is full');

      expect(await rows()).toEqual([]);
    });

    it('writes the file before the row, so a failed insert leaves a file and no row', async () => {
      const order: string[] = [];
      const write = storage.write.bind(storage);

      jest.spyOn(storage, 'write').mockImplementation(async (key, bytes) => {
        order.push('file');
        await write(key, bytes);
      });

      /* The insert of the entry fails; any other insert goes through. */
      /* Called below with the manager as `this`, so it is not unbound. */
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const insert = EntityManager.prototype.insert;
      jest
        .spyOn(EntityManager.prototype, 'insert')
        .mockImplementation(function (
          this: EntityManager,
          target: unknown,
          ...rest: unknown[]
        ) {
          if (target === EntryEntity) {
            order.push('row');
            return Promise.reject(new Error('the insert failed'));
          }

          return (insert as (...args: unknown[]) => Promise<never>).call(
            this,
            target,
            ...rest,
          );
        });

      await expect(
        service.createVoiceMemo(RECORDING, 1_000, ALICE),
      ).rejects.toThrow('the insert failed');

      expect(order).toEqual(['file', 'row']);
      expect(await rows()).toEqual([]);
      expect(filesInFolder()).toHaveLength(1);

      /* The day it would have opened is rolled back with it. */
      expect(await dataSource.query(`SELECT id FROM days`)).toEqual([]);
    });
  });

  describe('readAudio', () => {
    it('gives the owner the same bytes, with the type it was recorded in', async () => {
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);

      expect(await service.readAudio(memo.id, ALICE.id)).toEqual(RECORDING);
    });

    it("gives nobody else another person's memo", async () => {
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);

      expect(await service.readAudio(memo.id, BOB.id)).toBeUndefined();
    });

    it('gives nothing for a deleted memo', async () => {
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);
      await service.delete(memo.id, ALICE.id);

      expect(await service.readAudio(memo.id, ALICE.id)).toBeUndefined();
      expect(filesInFolder()).toHaveLength(1);
    });

    it('gives nothing for a typed entry, or for an id that does not exist', async () => {
      const typed = await service.create('just words', ALICE);

      expect(await service.readAudio(typed.id, ALICE.id)).toBeUndefined();
      expect(await service.readAudio('no-such-id', ALICE.id)).toBeUndefined();
    });
  });

  describe('update', () => {
    it('refuses a memo, and leaves it as it was', async () => {
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);
      const before = await rows();

      expect(await service.update(memo.id, 'words', ALICE.id)).toEqual({
        status: 'isVoiceMemo',
      });
      expect(await rows()).toEqual(before);
    });

    it("says not found for another person's memo, as for any entry of theirs", async () => {
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);

      expect(await service.update(memo.id, 'words', BOB.id)).toEqual({
        status: 'notFound',
      });
    });
  });

  describe('listing and search', () => {
    it('lists a memo beside typed entries, and finds no memo by a word or by an empty search', async () => {
      const typed = await service.create('a typed thought', ALICE);
      const memo = await service.createVoiceMemo(RECORDING, 1_000, ALICE);

      expect(
        (await service.find(ALICE.id)).map((entry) => entry.id).sort(),
      ).toEqual([typed.id, memo.id].sort());
      expect(
        (await service.find(ALICE.id, { word: 'thought' })).map(
          (entry) => entry.id,
        ),
      ).toEqual([typed.id]);
      expect(await service.find(ALICE.id, { word: '' })).toEqual([]);
      expect(await service.count(ALICE.id, { word: '' })).toBe(0);
    });
  });
});
