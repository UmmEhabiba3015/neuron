import { EntryKind } from '@neuron/contracts';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedUser,
} from '../../test/support/test-database';
import { DayEntity } from '../days/entities/day.entity';
import { DaysRepository } from '../days/days.repository';
import type { EntryFilters } from './types/entry-filters.interface';
import { EntryEntity } from './entities/entry.entity';
import { EntriesRepository } from './entries.repository';

const ALL = { limit: 200, offset: 0 };

/*
 * Every query that answers "which entries". Each one names the owner in its
 * WHERE clause (ADR-013), leaves deleted entries out (ADR-020), and reads an
 * entry's date from the day row it points at, never from created_at
 * (ADR-015).
 *
 * The entries are put in place with the day the test chooses, so that an
 * entry can sit under a date its created_at would not give today.
 */
describe('EntriesRepository', () => {
  let dataSource: DataSource;
  let repository: EntriesRepository;

  const write = async (
    id: string,
    userId: string,
    content: string,
    createdAt: string,
    date = createdAt.slice(0, 10),
  ) => {
    const day = await new DaysRepository(
      dataSource.getRepository(DayEntity),
    ).findOrCreate(userId, date);

    await dataSource
      .getRepository(EntryEntity)
      .insert({ id, content, createdAt, userId, dayId: day.id });
  };

  const ids = async (userId: string, filters: EntryFilters = {}, page = ALL) =>
    (await repository.find(userId, filters, page)).map((entry) => entry.id);

  const rowOf = async (id: string) =>
    (
      await dataSource.query<{ content: string; deleted_at: string | null }[]>(
        'SELECT content, deleted_at FROM entries WHERE id = ?',
        [id],
      )
    )[0];

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    await seedUser(dataSource, 'alice');
    await seedUser(dataSource, 'bob');
    repository = new EntriesRepository(dataSource.getRepository(EntryEntity));

    /*
     * Alice writes on the 8th and the 9th, a minute apart, and Bob on the
     * 9th. "late" was written at 02:00Z on the 10th and filed under the
     * 9th, the way an entry from before midnight became the boundary sits.
     */
    await write(
      'e8-1',
      'alice',
      'the day before, first',
      '2026-08-08T12:00:00.000Z',
    );
    await write(
      'e8-2',
      'alice',
      'the day before, about the flat',
      '2026-08-08T12:01:00.000Z',
    );
    await write(
      'e9-1',
      'alice',
      'sister called about the flat',
      '2026-08-09T12:00:00.000Z',
    );
    await write(
      'e9-2',
      'alice',
      'sister again, briefly',
      '2026-08-09T12:01:00.000Z',
    );
    await write(
      'e9-3',
      'alice',
      'the flat people said Tuesday',
      '2026-08-09T12:02:00.000Z',
    );
    await write(
      'late',
      'alice',
      'after midnight',
      '2026-08-10T02:00:00.000Z',
      '2026-08-09',
    );
    await write(
      'bob-9',
      'bob',
      "bob's entry about the flat",
      '2026-08-09T12:00:00.000Z',
    );
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  describe('the owner', () => {
    it('is in every read: find, find by word, find by date, count and findById', async () => {
      expect(await ids('bob')).toEqual(['bob-9']);
      expect(await ids('bob', { word: 'flat' })).toEqual(['bob-9']);
      expect(await ids('bob', { date: '2026-08-09' })).toEqual(['bob-9']);
      expect(await repository.count('bob', {})).toBe(1);
      expect(await repository.count('bob', { word: 'sister' })).toBe(0);
      expect(await repository.findById('e9-1', 'bob')).toBeUndefined();
      expect(await repository.findById('e9-1', 'alice')).toBeDefined();
    });

    it('is in every write: another user can neither edit nor delete an entry', async () => {
      expect(
        await repository.update('e9-1', 'rewritten', 'bob'),
      ).toBeUndefined();
      expect(
        await repository.markDeleted('e9-1', 'bob', '2026-08-09T13:00:00.000Z'),
      ).toBe(false);

      expect(await rowOf('e9-1')).toEqual({
        content: 'sister called about the flat',
        deleted_at: null,
      });
    });
  });

  describe('a deleted entry', () => {
    const DELETED_AT = '2026-08-09T13:00:00.000Z';

    beforeEach(async () => {
      expect(await repository.markDeleted('e9-2', 'alice', DELETED_AT)).toBe(
        true,
      );
    });

    it('stays in the table, with deleted_at set to the instant it was deleted', async () => {
      expect(await rowOf('e9-2')).toEqual({
        content: 'sister again, briefly',
        deleted_at: DELETED_AT,
      });
      expect((await rowOf('e9-1')).deleted_at).toBeNull();
      expect((await rowOf('e9-3')).deleted_at).toBeNull();
    });

    it.each([
      ['no filter', {}],
      ['a word it contains', { word: 'sister' }],
      ['a word only it contains', { word: 'briefly' }],
      ['its date', { date: '2026-08-09' }],
      ['its date and a word', { date: '2026-08-09', word: 'sister' }],
    ])('is never listed or counted, with %s', async (_label, filters) => {
      const listed = await ids('alice', filters);

      expect(listed).not.toContain('e9-2');
      expect(await repository.count('alice', filters)).toBe(listed.length);
    });

    /* Newest first, e9-3 then e9-2 then e9-1: the deleted one held a place. */
    it('leaves no gap in the pages where it was', async () => {
      const page = (offset: number) =>
        ids('alice', { date: '2026-08-09' }, { limit: 1, offset });

      expect(await page(0)).toEqual(['late']);
      expect(await page(1)).toEqual(['e9-3']);
      expect(await page(2)).toEqual(['e9-1']);
      expect(await page(3)).toEqual([]);
    });

    it('cannot be found, edited, or deleted a second time', async () => {
      expect(await repository.findById('e9-2', 'alice')).toBeUndefined();
      expect(
        await repository.update('e9-2', 'written over it', 'alice'),
      ).toBeUndefined();
      expect(
        await repository.markDeleted(
          'e9-2',
          'alice',
          '2026-08-09T14:00:00.000Z',
        ),
      ).toBe(false);

      expect(await rowOf('e9-2')).toEqual({
        content: 'sister again, briefly',
        deleted_at: DELETED_AT,
      });
    });
  });

  describe('the date filter', () => {
    it('returns the entries filed on that day and only those, newest first', async () => {
      expect(await ids('alice', { date: '2026-08-09' })).toEqual([
        'late',
        'e9-3',
        'e9-2',
        'e9-1',
      ]);
      expect(await ids('alice', { date: '2026-08-08' })).toEqual([
        'e8-2',
        'e8-1',
      ]);
      expect(await ids('alice', { date: '2026-08-01' })).toEqual([]);
    });

    it('reads the day row, not created_at, and answers with the stored date', async () => {
      expect(await ids('alice', { date: '2026-08-10' })).toEqual([]);

      const late = await repository.findById('late', 'alice');

      expect(late?.createdAt).toBe('2026-08-10T02:00:00.000Z');
      expect(late?.day.date).toBe('2026-08-09');
    });

    it('narrows a word, and pages', async () => {
      expect(await ids('alice', { word: 'the day' })).toEqual(['e8-2', 'e8-1']);
      expect(
        await ids('alice', { date: '2026-08-09', word: 'the day' }),
      ).toEqual([]);
      expect(await ids('alice', { date: '2026-08-09', word: 'flat' })).toEqual([
        'e9-3',
        'e9-1',
      ]);
      expect(
        await ids('alice', { date: '2026-08-08' }, { limit: 1, offset: 1 }),
      ).toEqual(['e8-1']);
    });
  });

  describe('the kind filter', () => {
    /* Two memos of Alice's on the 9th, one of them deleted. */
    beforeEach(async () => {
      for (const [id, minute] of [
        ['memo-1', '03'],
        ['memo-gone', '04'],
      ]) {
        const day = await new DaysRepository(
          dataSource.getRepository(DayEntity),
        ).findOrCreate('alice', '2026-08-09');

        await dataSource.getRepository(EntryEntity).insert({
          id,
          kind: EntryKind.Voice,
          content: null,
          audioKey: crypto.randomUUID(),
          audioType: 'audio/x-test',
          durationMs: 1000,
          createdAt: `2026-08-09T12:${minute}:00.000Z`,
          userId: 'alice',
          dayId: day.id,
        });
      }

      await repository.markDeleted(
        'memo-gone',
        'alice',
        '2026-08-09T13:00:00.000Z',
      );
    });

    it('lists only voice memos, or only typed entries, and both when absent', async () => {
      expect(await ids('alice', { kind: EntryKind.Voice })).toEqual(['memo-1']);
      expect(await ids('alice', { kind: EntryKind.Text })).toEqual([
        'late',
        'e9-3',
        'e9-2',
        'e9-1',
        'e8-2',
        'e8-1',
      ]);
      expect(await ids('alice')).toHaveLength(7);
      expect(await ids('bob', { kind: EntryKind.Voice })).toEqual([]);
    });

    it('narrows a date and a word, as every filter does', async () => {
      expect(
        await ids('alice', { kind: EntryKind.Voice, date: '2026-08-08' }),
      ).toEqual([]);
      expect(
        await ids('alice', { kind: EntryKind.Text, word: 'sister' }),
      ).toEqual(['e9-2', 'e9-1']);
      expect(
        await ids('alice', { kind: EntryKind.Voice, word: 'sister' }),
      ).toEqual([]);
    });

    it.each([
      ['voice memos', { kind: EntryKind.Voice }],
      ['typed entries', { kind: EntryKind.Text }],
      ['voice memos on a date', { kind: EntryKind.Voice, date: '2026-08-09' }],
      ['typed entries with a word', { kind: EntryKind.Text, word: 'flat' }],
    ])('counts exactly what find returns, for %s', async (_label, filters) => {
      expect(await repository.count('alice', filters)).toBe(
        (await ids('alice', filters)).length,
      );
    });

    it('counts 1 recording and 6 entries, the deleted memo in neither', async () => {
      expect(await repository.count('alice', { kind: EntryKind.Voice })).toBe(
        1,
      );
      expect(await repository.count('alice', { kind: EntryKind.Text })).toBe(6);
    });
  });

  it.each([
    ['no filter', {}],
    ['a word that matches twice', { word: 'sister' }],
    ['a word that matches nothing', { word: 'zzzz' }],
    ['an empty word', { word: '' }],
    ['a date', { date: '2026-08-09' }],
    ['a date with nothing on it', { date: '2026-08-01' }],
    ['a date and a word', { date: '2026-08-09', word: 'flat' }],
    [
      'a date and a word that only matches on another date',
      { date: '2026-08-08', word: 'sister' },
    ],
  ])('counts exactly what find returns, for %s', async (_label, filters) => {
    expect(await repository.count('alice', filters)).toBe(
      (await ids('alice', filters)).length,
    );
  });

  it('pages without repeating or skipping, and answers past the end with nothing', async () => {
    const seen: string[] = [];

    for (let offset = 0; offset < 6; offset += 4) {
      seen.push(...(await ids('alice', {}, { limit: 4, offset })));
    }

    expect(seen).toEqual(await ids('alice'));
    expect(new Set(seen).size).toBe(6);
    expect(await ids('alice', {}, { limit: 5, offset: 500 })).toEqual([]);
  });

  /*
   * The date of each entry must not cost a query of its own. SQLite has one
   * connection and TypeORM sends every statement through one query runner,
   * so watching it sees every statement.
   */
  it('reads any number of entries, with their dates, in one query', async () => {
    const queriesDuring = async (ask: () => Promise<unknown>) => {
      const spy = jest.spyOn(dataSource.createQueryRunner(), 'query');

      try {
        await ask();

        return spy.mock.calls.map(([sql]) => sql);
      } finally {
        spy.mockRestore();
      }
    };

    const forOne = await queriesDuring(() => repository.find('bob', {}, ALL));

    for (let day = 1; day <= 29; day++) {
      const date = `2026-07-${String(day).padStart(2, '0')}`;
      await write(`july-${day}`, 'bob', `July ${day}`, `${date}T12:00:00.000Z`);
    }

    let dates = new Set<string>();
    const forThirty = await queriesDuring(async () => {
      dates = new Set(
        (await repository.find('bob', {}, ALL)).map((entry) => entry.day.date),
      );
    });

    expect(dates.size).toBe(30);
    expect(forOne).toHaveLength(1);
    expect(forThirty).toHaveLength(1);
    expect(forThirty[0]).toMatch(/FROM "entries"/);
    expect(forThirty[0]).toMatch(/"days"/);
  });
});
