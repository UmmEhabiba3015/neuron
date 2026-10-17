import { EntryKind } from '@neuron/contracts';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedEntries,
  seedUser,
} from '../../test/support/test-database';
import { AudioKeysRepository } from './audio-keys.repository';
import { AudioStorage } from './audio-storage';
import { AudioSweep } from './audio-sweep.service';
import { EntryEntity } from './entities/entry.entity';
import { EntriesRepository } from './entries.repository';

/*
 * The sweep at start (ADR-024): a file no entries row points at goes, and
 * every file a row points at stays, the row of a soft-deleted memo included.
 */
describe('AudioSweep', () => {
  const LIVE = '11111111-1111-4111-8111-111111111111';
  const DELETED = '22222222-2222-4222-8222-222222222222';
  const BOBS = '33333333-3333-4333-8333-333333333333';
  const ORPHAN = '44444444-4444-4444-8444-444444444444';

  let dataSource: DataSource;
  let folder: string;
  let storage: AudioStorage;
  let sweep: AudioSweep;

  const memo = (id: string, audioKey: string, createdAt: string) => ({
    id,
    kind: EntryKind.Voice,
    content: null,
    audioKey,
    audioType: 'audio/webm',
    durationMs: 5000,
    createdAt,
  });

  const present = (key: string) => existsSync(join(folder, key));

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    folder = mkdtempSync(join(tmpdir(), 'neuron-sweep-'));
    storage = new AudioStorage(folder);
    sweep = new AudioSweep(
      storage,
      new AudioKeysRepository(dataSource.getRepository(EntryEntity)),
    );

    await seedUser(dataSource, 'alice');
    await seedUser(dataSource, 'bob');
    await seedEntries(
      dataSource,
      [
        memo('live', LIVE, '2026-10-16T09:00:00.000Z'),
        memo('deleted', DELETED, '2026-10-16T09:01:00.000Z'),
      ],
      'alice',
    );
    await seedEntries(
      dataSource,
      [memo('bobs', BOBS, '2026-10-16T09:02:00.000Z')],
      'bob',
    );

    /* A soft delete, as DELETE /entries/:id makes it (ADR-020). */
    await new EntriesRepository(
      dataSource.getRepository(EntryEntity),
    ).markDeleted('deleted', 'alice', '2026-10-16T10:00:00.000Z');

    for (const key of [LIVE, DELETED, BOBS, ORPHAN]) {
      await storage.write(key, Buffer.from(key));
    }
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
    rmSync(folder, { recursive: true, force: true });
  });

  it('keeps the file of a soft-deleted memo', async () => {
    await sweep.sweep();

    expect(present(DELETED)).toBe(true);
    expect((await storage.read(DELETED)).toString()).toBe(DELETED);
  });

  it('keeps every file a live memo points at, whoever owns it', async () => {
    await sweep.sweep();

    expect(present(LIVE)).toBe(true);
    expect(present(BOBS)).toBe(true);
  });

  it('removes a file no entry points at, and says how many it removed', async () => {
    expect(await sweep.sweep()).toBe(1);

    expect(present(ORPHAN)).toBe(false);
    expect(await sweep.sweep()).toBe(0);
  });

  it('leaves alone a file the API did not name', async () => {
    writeFileSync(join(folder, 'notes.txt'), 'not audio');

    await sweep.sweep();

    expect(present('notes.txt')).toBe(true);
  });

  it('goes on past a file it cannot remove, and the start is not stopped', async () => {
    jest
      .spyOn(storage, 'remove')
      .mockRejectedValueOnce(new Error('permission denied'));
    const warned = jest
      .spyOn(sweep['logger'], 'warn')
      .mockImplementation(() => undefined);

    await expect(sweep.sweep()).resolves.toBe(0);
    expect(warned).toHaveBeenCalledWith(expect.stringContaining(ORPHAN));
  });

  it('is what the application runs when it starts', async () => {
    await sweep.onApplicationBootstrap();

    expect(present(ORPHAN)).toBe(false);
    expect(present(DELETED)).toBe(true);
  });
});
