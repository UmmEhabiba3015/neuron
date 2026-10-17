import { EntryKind, Mood, type JournalExport } from '@neuron/contracts';
import { unzipSync, strFromU8 } from 'fflate';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedEntries,
  seedUser,
} from '../../test/support/test-database';
import { DayEntity } from '../days/entities/day.entity';
import { AudioStorage } from '../entries/audio-storage';
import { EntryEntity } from '../entries/entities/entry.entity';
import { EntriesRepository } from '../entries/entries.repository';
import { UserEntity } from '../users/entities/user.entity';
import { ExportRepository } from './export.repository';
import { ExportService, extensionOf } from './export.service';

/*
 * The export's contents (ADR-025): only the person's own live entries,
 * oldest first, grouped by day with its mood; the JSON in the contract's
 * shapes with every character kept; and each memo's audio as recorded.
 */
describe('ExportService', () => {
  const WEBM = '11111111-1111-4111-8111-111111111111';
  const MP4 = '22222222-2222-4222-8222-222222222222';
  const GONE = '33333333-3333-4333-8333-333333333333';
  const BOBS = '44444444-4444-4444-8444-444444444444';
  const EMOJI = 'a good day 😀👩‍👩‍👧 ✓';

  let dataSource: DataSource;
  let folder: string;
  let storage: AudioStorage;
  let service: ExportService;
  let alice: UserEntity;

  const memo = (
    id: string,
    audioKey: string,
    audioType: string,
    createdAt: string,
  ) => ({
    id,
    kind: EntryKind.Voice,
    content: null,
    audioKey,
    audioType,
    durationMs: 151_000,
    createdAt,
  });

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    folder = mkdtempSync(join(tmpdir(), 'neuron-export-'));
    storage = new AudioStorage(folder);
    service = new ExportService(
      new ExportRepository(dataSource.getRepository(EntryEntity)),
      storage,
    );

    await seedUser(dataSource, 'alice');
    await seedUser(dataSource, 'bob');
    await dataSource
      .getRepository(UserEntity)
      .update({ id: 'alice' }, { timezone: 'Asia/Karachi' });
    alice = (await dataSource
      .getRepository(UserEntity)
      .findOneBy({ id: 'alice' }))!;

    /* Seeded out of order, so that the order of the export is its own. */
    await seedEntries(
      dataSource,
      [
        { id: 'late', content: EMOJI, createdAt: '2026-10-16T09:00:00.000Z' },
        memo('mp4', MP4, 'audio/mp4', '2026-10-16T08:00:00.000Z'),
        {
          id: 'first',
          content: 'the first',
          createdAt: '2026-10-15T09:00:00.000Z',
        },
        memo('webm', WEBM, 'audio/webm', '2026-10-15T10:00:00.000Z'),
        {
          id: 'deleted',
          content: 'gone',
          createdAt: '2026-10-15T11:00:00.000Z',
        },
        memo('deleted-memo', GONE, 'audio/webm', '2026-10-15T12:00:00.000Z'),
      ],
      'alice',
    );
    await seedEntries(
      dataSource,
      [memo('bobs', BOBS, 'audio/webm', '2026-10-15T10:00:00.000Z')],
      'bob',
    );

    await dataSource
      .getRepository(DayEntity)
      .update({ userId: 'alice', date: '2026-10-15' }, { mood: Mood.Even });

    const entries = new EntriesRepository(
      dataSource.getRepository(EntryEntity),
    );
    await entries.markDeleted('deleted', 'alice', '2026-10-16T00:00:00.000Z');
    await entries.markDeleted(
      'deleted-memo',
      'alice',
      '2026-10-16T00:00:00.000Z',
    );

    for (const key of [WEBM, MP4, GONE, BOBS]) {
      await storage.write(key, Buffer.from(`bytes of ${key}`));
    }
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await closeTestDataSource(dataSource);
    rmSync(folder, { recursive: true, force: true });
  });

  const build = async (now = new Date('2026-10-16T20:00:00.000Z')) => {
    const file = await service.build(alice, now);
    const files = unzipSync(file.bytes);

    return {
      file,
      files,
      journal: JSON.parse(strFromU8(files['journal.json'])) as JournalExport,
    };
  };

  it('holds journal.pdf, journal.json and the audio of each live memo, and nothing else', async () => {
    const { files } = await build();

    expect(Object.keys(files).sort()).toEqual([
      'audio/mp4.mp4',
      'audio/webm.webm',
      'journal.json',
      'journal.pdf',
    ]);
    expect(strFromU8(files['journal.pdf'].subarray(0, 5))).toBe('%PDF-');
    expect(strFromU8(files['audio/webm.webm'])).toBe(`bytes of ${WEBM}`);
    expect(strFromU8(files['audio/mp4.mp4'])).toBe(`bytes of ${MP4}`);
  });

  it("puts the person's own live entries in the JSON, oldest first, grouped by day with its mood", async () => {
    const { journal } = await build();

    expect(journal.exportedAt).toBe('2026-10-16T20:00:00.000Z');
    expect(journal.user).toEqual({
      id: 'alice',
      email: 'alice@example.com',
      createdAt: '2026-09-01T00:00:00.000Z',
      name: 'alice',
      timezone: 'Asia/Karachi',
    });
    expect(
      journal.days.map((day) => [
        day.date,
        day.mood,
        day.entries.map((e) => e.id),
      ]),
    ).toEqual([
      ['2026-10-15', Mood.Even, ['first', 'webm']],
      ['2026-10-16', null, ['mp4', 'late']],
    ]);
  });

  it('writes each entry in the shape GET /entries answers with, and no audio key', async () => {
    const { journal, files } = await build();

    expect(journal.days[0].entries[1]).toEqual({
      id: 'webm',
      kind: EntryKind.Voice,
      content: null,
      durationMs: 151_000,
      createdAt: '2026-10-15T10:00:00.000Z',
      date: '2026-10-15',
    });
    expect(strFromU8(files['journal.json'])).not.toContain(WEBM);
  });

  it('keeps every character exactly in the JSON, emoji included', async () => {
    const { journal } = await build();

    expect(journal.days[1].entries[1].content).toBe(EMOJI);
  });

  it("names the file with today's date in the person's timezone", async () => {
    /* 20:00Z on the 16th is already the 17th in Karachi. */
    expect((await build()).file.filename).toBe('neuron-export-2026-10-17.zip');
  });

  it('goes on without a recording whose file cannot be read', async () => {
    await storage.remove(MP4);
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);

    const { files, journal } = await build();

    expect(Object.keys(files)).not.toContain('audio/mp4.mp4');
    expect(journal.days[1].entries.map((entry) => entry.id)).toContain('mp4');
  });

  it('exports an empty journal as a journal with no days', async () => {
    const bob = (await dataSource
      .getRepository(UserEntity)
      .findOneBy({ id: 'bob' }))!;
    await dataSource.query(`DELETE FROM entries WHERE user_id = 'bob'`);

    const files = unzipSync((await service.build(bob)).bytes);

    expect(Object.keys(files).sort()).toEqual(['journal.json', 'journal.pdf']);
    expect(
      (JSON.parse(strFromU8(files['journal.json'])) as JournalExport).days,
    ).toEqual([]);
  });
});

describe('extensionOf', () => {
  it('is the subtype of the stored type', () => {
    expect(extensionOf('audio/webm')).toBe('webm');
    expect(extensionOf('audio/mp4')).toBe('mp4');
    expect(extensionOf('audio/webm;codecs=opus')).toBe('webm');
  });
});
