import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
  seedEntries,
} from '../../test/test-database';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.interface';

// Every call below is awaited, and none of the claims moved. TypeORM has no
// synchronous API, so `findAll()` returns a promise where it used to return an
// array — `expect(await service.findAll()).toEqual([])` states exactly what
// `expect(service.findAll()).toEqual([])` stated (ADR-010).
describe('EntriesService', () => {
  let service: EntriesService;
  let dataSource: DataSource;

  beforeEach(async () => {
    // This is the payoff for injecting the database instead of letting the
    // service open its own. `':memory:'` is a real SQLite database that never
    // touches the filesystem — so these tests can't corrupt (or be polluted by)
    // the development database, and because it's rebuilt in `beforeEach`, each
    // test starts from a genuinely empty table. A service that constructed its
    // own DataSource would leave no way to do this.
    dataSource = await createTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        // EntriesService no longer touches the database itself, but it can't
        // be constructed without the repository that does — so the repository
        // has to be here for the module to compile.
        EntriesRepository,
        // Same shape of swap the DATABASE symbol used to allow, one token
        // along: `EntriesRepository` asks for the token
        // `TypeOrmModule.forFeature([JournalEntry])` would have registered,
        // and has no idea it's been handed a throwaway.
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
    // The old version of this suite could assume two seeded entries existed.
    // Nothing seeds the database now, so "empty" is the real starting state —
    // and worth asserting, because a stale test database would break it.
    it('should return nothing for a fresh database', async () => {
      expect(await service.findAll()).toEqual([]);
    });

    it('should return an entry that was created', async () => {
      const created = await service.create('a thought worth keeping');

      expect(await service.findAll()).toContainEqual(created);
    });

    it('should return entries newest first', async () => {
      // Written straight to the table rather than through `create()`, because
      // `create()` timestamps with the real clock — and two calls in a row
      // land in the same millisecond, leaving `ORDER BY created_at` with no
      // tiebreaker and the assertion flaky. (That first attempt failed, which
      // is how the limitation below got noticed rather than assumed.) Fixing
      // the clock in the test makes the ordering claim the only variable.
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
      );

      expect(created.content).toBe('the client supplied only this text');
      // The client sent neither of these, so their existence is the claim.
      expect(created.id.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    });

    it('should give each entry a distinct id', async () => {
      const a = await service.create('same text');
      const b = await service.create('same text');

      expect(a.id).not.toBe(b.id);
    });

    it('should store the content verbatim, including SQL syntax', async () => {
      // Not a security test so much as a demonstration of what bound
      // parameters buy: this string is data on the way in and data on the way
      // out. Concatenated into the SQL, it would have been executed.
      const hostile = `'); DROP TABLE entries; --`;

      await service.create(hostile);

      expect((await service.findAll()).map((e) => e.content)).toEqual([
        hostile,
      ]);
    });
  });

  describe('create', () => {
    // The controller rejects whitespace-only content, but content that merely
    // *contains* surrounding whitespace is valid and must survive unchanged.
    // Trimming happens nowhere: whitespace decides validity at the boundary and
    // never rewrites what the user actually wrote (ADR-005).
    it('should store content verbatim, without trimming surrounding whitespace', async () => {
      const padded = '  spacing the user chose  ';

      const created = await service.create(padded);

      expect(created.content).toBe(padded);
      expect((await service.findById(created.id))?.content).toBe(padded);
    });
  });

  describe('findById', () => {
    it('should return the entry that was created', async () => {
      const created = await service.create('findable by its id');

      expect(await service.findById(created.id)).toEqual(created);
    });

    // `undefined`, not an exception. The service has to stay callable from a
    // background job with no HTTP response to write, so it reports absence as
    // a value and leaves the 404 to the controller — asserted in
    // entries.controller.spec.ts (ADR-005).
    it('should return undefined when the id does not exist', async () => {
      expect(await service.findById('no-such-id')).toBeUndefined();
    });
  });

  describe('findByContent', () => {
    // Fixed timestamps written straight to the table, for the reason the
    // comment in `findAll` above explains: `create()` uses the real clock, and
    // two calls in a row tie on milliseconds.
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

    // This is the regression test the whole day exists for. `findByContent`
    // was written by copying the SELECT from `findAll` without its
    // `ORDER BY created_at DESC`, so `/entries` and `/entries?word=…` returned
    // the same resource in different orders — and lint, typecheck, build and
    // test all passed anyway, because no test had ever stated the rule.
    it('should return matching entries newest first', async () => {
      await seed();

      expect(
        (await service.findByContent('work')).map((entry) => entry.id),
      ).toEqual(['newer-match', 'older-match']);
    });

    // An empty array is the complete answer to "which entries contain zzz",
    // not a failure — so this is a 200 with `[]` and never an exception. Note
    // the asymmetry with `findById` returning `undefined`: a single missing
    // thing has no representation, but a collection query always has one
    // (ADR-005).
    it('should return an empty array when nothing matches', async () => {
      await seed();

      expect(await service.findByContent('zzz')).toEqual([]);
    });

    // Searching for nothing finds nothing, and this is the one search claim
    // that a correct-looking implementation gets exactly backwards. `LIKE '%%'`
    // matches every row, so a `findByContent` that simply forwarded the empty
    // string would answer with the entire journal — the same wrong answer, from
    // a different layer, that the controller used to give by treating `""` as
    // falsy (ADR-008, Decision 7).
    //
    // The seed matters: without rows in the table, returning everything and
    // returning nothing look identical.
    it('should return nothing for an empty search term', async () => {
      await seed();

      expect((await service.findAll()).length).toBeGreaterThan(0);
      expect(await service.findByContent('')).toEqual([]);
    });
  });

  // These three claims never mention SQL, `LIKE`, or escaping, and that is
  // deliberate. The implementation underneath them is condemned — full-text
  // search replaces it on Day 15 and embeddings on Day 16 — but the sentence
  // *searching for a character finds entries containing that character* is true
  // of all three implementations, so these tests should survive the rewrite
  // (ADR-006).
  describe('findByContent with characters the search engine treats specially', () => {
    // Four entries, of which exactly one contains each special character. The
    // count is the point: a broken search returns all four, so an assertion
    // naming one id fails loudly rather than passing because the one entry it
    // wanted happened to be somewhere in the result. This is what the word
    // "only" in each test name is doing.
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
        // A single backslash in the stored text. Written `\\` because a
        // backslash is JavaScript's own escape character too.
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

    // The character the escaping mechanism uses for itself, and the only claim
    // here that catches a particular mistake: escaping `%` and `_` while never
    // escaping the escape character. Under that version the two claims above
    // still pass, and this one returns the entry containing a percent sign,
    // because the lone backslash in the pattern is read as marking the
    // character after it rather than as text. Verified by making the change and
    // watching exactly this test go red.
    it('should return only entries containing a literal backslash', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.findByContent('\\')).map((entry) => entry.id),
      ).toEqual(['has-backslash']);
    });

    // The user-facing half of the same rule. A journal that cannot find the
    // words someone actually wrote is the reason any of this matters.
    it('should find an entry by a word that contains a percent sign', async () => {
      await seedSpecialCharacters();

      expect(
        (await service.findByContent('100%')).map((entry) => entry.id),
      ).toEqual(['has-percent']);
    });
  });

  describe('update', () => {
    it('should change the content and leave the entry findable', async () => {
      const created = await service.create('the first draft');

      const updated = await service.update(created.id, 'the second draft');

      expect(updated?.content).toBe('the second draft');
      expect((await service.findById(created.id))?.content).toBe(
        'the second draft',
      );
    });

    // `createdAt` records when the entry was written, not when it was last
    // touched. Nothing displays or sorts by an edit time yet, so there is no
    // `updatedAt` either — see ADR-006.
    it('should not change id or createdAt', async () => {
      const created = await service.create('written once');

      const updated = await service.update(created.id, 'edited later');

      expect(updated?.id).toBe(created.id);
      expect(updated?.createdAt).toBe(created.createdAt);
    });

    // Whitespace decides validity at the boundary and never rewrites the
    // value, on update exactly as on create.
    it('should store the new content verbatim, without trimming', async () => {
      const created = await service.create('before');
      const padded = '  the spacing the user chose  ';

      expect((await service.update(created.id, padded))?.content).toBe(padded);
      expect((await service.findById(created.id))?.content).toBe(padded);
    });

    // `undefined`, not an exception. Turning absence into a 404 is the
    // controller's job and only the controller's (ADR-005).
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
      const created = await service.create('here for a moment');

      expect(await service.delete(created.id)).toEqual(created);
      expect(await service.findById(created.id)).toBeUndefined();
      expect(await service.countEntries()).toBe(0);
    });

    it('should leave other entries alone', async () => {
      const doomed = await service.create('the one being removed');
      const survivor = await service.create('the one that stays');

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
      await service.create('one');
      await service.create('two');
      await service.create('three');

      expect(await service.countEntries()).toBe(3);
    });
  });
});
