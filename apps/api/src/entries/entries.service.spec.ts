import { DatabaseSync } from 'node:sqlite';
import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE } from '../database/database.module';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';

describe('EntriesService', () => {
  let service: EntriesService;
  let db: DatabaseSync;

  beforeEach(async () => {
    // This is the payoff for injecting the database instead of letting the
    // service open its own. `':memory:'` is a real SQLite database that never
    // touches the filesystem — so these tests can't corrupt (or be polluted by)
    // the development database, and because it's rebuilt in `beforeEach`, each
    // test starts from a genuinely empty table. A service that called
    // `new DatabaseSync(...)` itself would leave no way to do this.
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE entries (
        id         TEXT PRIMARY KEY,
        content    TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        // EntriesService no longer touches the database itself, but it can't
        // be constructed without the repository that does — so the repository
        // has to be here for the module to compile.
        EntriesRepository,
        // Same token, different value. The repository asks for DATABASE and
        // has no idea it's been handed a throwaway.
        { provide: DATABASE, useValue: db },
      ],
    }).compile();

    service = module.get<EntriesService>(EntriesService);
  });

  afterEach(() => {
    db.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    // The old version of this suite could assume two seeded entries existed.
    // Nothing seeds the database now, so "empty" is the real starting state —
    // and worth asserting, because a stale test database would break it.
    it('should return nothing for a fresh database', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('should return an entry that was created', () => {
      const created = service.create('a thought worth keeping');

      expect(service.findAll()).toContainEqual(created);
    });

    it('should return entries newest first', () => {
      // Written straight to the table rather than through `create()`, because
      // `create()` timestamps with the real clock — and two calls in a row
      // land in the same millisecond, leaving `ORDER BY created_at` with no
      // tiebreaker and the assertion flaky. (That first attempt failed, which
      // is how the limitation below got noticed rather than assumed.) Fixing
      // the clock in the test makes the ordering claim the only variable.
      const insert = db.prepare(
        'INSERT INTO entries (id, content, created_at) VALUES (?, ?, ?)',
      );
      insert.run('older', 'written first', '2026-07-28T09:00:00.000Z');
      insert.run('newer', 'written second', '2026-07-29T09:00:00.000Z');

      expect(service.findAll().map((entry) => entry.id)).toEqual([
        'newer',
        'older',
      ]);
    });
  });

  describe('create', () => {
    it('should return the entry it stored, with a server-generated id and timestamp', () => {
      const created = service.create('the client supplied only this text');

      expect(created.content).toBe('the client supplied only this text');
      // The client sent neither of these, so their existence is the claim.
      expect(created.id.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    });

    it('should give each entry a distinct id', () => {
      const a = service.create('same text');
      const b = service.create('same text');

      expect(a.id).not.toBe(b.id);
    });

    it('should store the content verbatim, including SQL syntax', () => {
      // Not a security test so much as a demonstration of what bound
      // parameters buy: this string is data on the way in and data on the way
      // out. Concatenated into the SQL, it would have been executed.
      const hostile = `'); DROP TABLE entries; --`;

      service.create(hostile);

      expect(service.findAll().map((e) => e.content)).toEqual([hostile]);
    });
  });

  describe('create', () => {
    // The controller rejects whitespace-only content, but content that merely
    // *contains* surrounding whitespace is valid and must survive unchanged.
    // Trimming happens nowhere: whitespace decides validity at the boundary and
    // never rewrites what the user actually wrote (ADR-005).
    it('should store content verbatim, without trimming surrounding whitespace', () => {
      const padded = '  spacing the user chose  ';

      const created = service.create(padded);

      expect(created.content).toBe(padded);
      expect(service.findById(created.id)?.content).toBe(padded);
    });
  });

  describe('findById', () => {
    it('should return the entry that was created', () => {
      const created = service.create('findable by its id');

      expect(service.findById(created.id)).toEqual(created);
    });

    // `undefined`, not an exception. The service has to stay callable from a
    // background job with no HTTP response to write, so it reports absence as
    // a value and leaves the 404 to the controller — asserted in
    // entries.controller.spec.ts (ADR-005).
    it('should return undefined when the id does not exist', () => {
      expect(service.findById('no-such-id')).toBeUndefined();
    });
  });

  describe('findByContent', () => {
    // Fixed timestamps written straight to the table, for the reason the
    // comment in `findAll` above explains: `create()` uses the real clock, and
    // two calls in a row tie on milliseconds.
    const seed = () => {
      const insert = db.prepare(
        'INSERT INTO entries (id, content, created_at) VALUES (?, ?, ?)',
      );
      insert.run(
        'older-match',
        'felt overwhelmed at work',
        '2026-07-28T09:00:00.000Z',
      );
      insert.run(
        'no-match',
        'quiet evening at home',
        '2026-07-29T09:00:00.000Z',
      );
      insert.run(
        'newer-match',
        'back at work again',
        '2026-07-30T09:00:00.000Z',
      );
    };

    it('should return only the entries containing the word', () => {
      seed();

      expect(
        service
          .findByContent('work')
          .map((entry) => entry.id)
          .sort(),
      ).toEqual(['newer-match', 'older-match']);
    });

    // This is the regression test the whole day exists for. `findByContent`
    // was written by copying the SELECT from `findAll` without its
    // `ORDER BY created_at DESC`, so `/entries` and `/entries?word=…` returned
    // the same resource in different orders — and lint, typecheck, build and
    // test all passed anyway, because no test had ever stated the rule.
    it('should return matching entries newest first', () => {
      seed();

      expect(service.findByContent('work').map((entry) => entry.id)).toEqual([
        'newer-match',
        'older-match',
      ]);
    });

    // An empty array is the complete answer to "which entries contain zzz",
    // not a failure — so this is a 200 with `[]` and never an exception. Note
    // the asymmetry with `findById` returning `undefined`: a single missing
    // thing has no representation, but a collection query always has one
    // (ADR-005).
    it('should return an empty array when nothing matches', () => {
      seed();

      expect(service.findByContent('zzz')).toEqual([]);
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
    const seedSpecialCharacters = () => {
      const insert = db.prepare(
        'INSERT INTO entries (id, content, created_at) VALUES (?, ?, ?)',
      );
      insert.run(
        'has-percent',
        '100% exhausted today',
        '2026-07-28T09:00:00.000Z',
      );
      insert.run(
        'has-underscore',
        'named the file snake_case',
        '2026-07-29T09:00:00.000Z',
      );
      // A single backslash in the stored text. Written `\\` because a
      // backslash is JavaScript's own escape character too.
      insert.run(
        'has-backslash',
        'the path was C:\\temp',
        '2026-07-30T09:00:00.000Z',
      );
      insert.run(
        'has-none',
        'an ordinary quiet evening',
        '2026-07-31T09:00:00.000Z',
      );
    };

    it('should return only entries containing a literal percent sign', () => {
      seedSpecialCharacters();

      expect(service.findByContent('%').map((entry) => entry.id)).toEqual([
        'has-percent',
      ]);
    });

    it('should return only entries containing a literal underscore', () => {
      seedSpecialCharacters();

      expect(service.findByContent('_').map((entry) => entry.id)).toEqual([
        'has-underscore',
      ]);
    });

    // The character the escaping mechanism uses for itself, and the only claim
    // here that catches a particular mistake: escaping `%` and `_` while never
    // escaping the escape character. Under that version the two claims above
    // still pass, and this one returns the entry containing a percent sign,
    // because the lone backslash in the pattern is read as marking the
    // character after it rather than as text. Verified by making the change and
    // watching exactly this test go red.
    it('should return only entries containing a literal backslash', () => {
      seedSpecialCharacters();

      expect(service.findByContent('\\').map((entry) => entry.id)).toEqual([
        'has-backslash',
      ]);
    });

    // The user-facing half of the same rule. A journal that cannot find the
    // words someone actually wrote is the reason any of this matters.
    it('should find an entry by a word that contains a percent sign', () => {
      seedSpecialCharacters();

      expect(service.findByContent('100%').map((entry) => entry.id)).toEqual([
        'has-percent',
      ]);
    });
  });

  describe('update', () => {
    it('should change the content and leave the entry findable', () => {
      const created = service.create('the first draft');

      const updated = service.update(created.id, 'the second draft');

      expect(updated?.content).toBe('the second draft');
      expect(service.findById(created.id)?.content).toBe('the second draft');
    });

    // `createdAt` records when the entry was written, not when it was last
    // touched. Nothing displays or sorts by an edit time yet, so there is no
    // `updatedAt` either — see ADR-006.
    it('should not change id or createdAt', () => {
      const created = service.create('written once');

      const updated = service.update(created.id, 'edited later');

      expect(updated?.id).toBe(created.id);
      expect(updated?.createdAt).toBe(created.createdAt);
    });

    // Whitespace decides validity at the boundary and never rewrites the
    // value, on update exactly as on create.
    it('should store the new content verbatim, without trimming', () => {
      const created = service.create('before');
      const padded = '  the spacing the user chose  ';

      expect(service.update(created.id, padded)?.content).toBe(padded);
      expect(service.findById(created.id)?.content).toBe(padded);
    });

    // `undefined`, not an exception. Turning absence into a 404 is the
    // controller's job and only the controller's (ADR-005).
    it('should return undefined when the id does not exist', () => {
      expect(service.update('no-such-id', 'anything')).toBeUndefined();
    });

    it('should not create an entry for an id that does not exist', () => {
      service.update('no-such-id', 'anything');

      expect(service.countEntries()).toBe(0);
    });
  });

  describe('delete', () => {
    it('should return the deleted entry and remove it', () => {
      const created = service.create('here for a moment');

      expect(service.delete(created.id)).toEqual(created);
      expect(service.findById(created.id)).toBeUndefined();
      expect(service.countEntries()).toBe(0);
    });

    it('should leave other entries alone', () => {
      const doomed = service.create('the one being removed');
      const survivor = service.create('the one that stays');

      service.delete(doomed.id);

      expect(service.findAll()).toEqual([survivor]);
    });

    it('should return undefined when the id does not exist', () => {
      expect(service.delete('no-such-id')).toBeUndefined();
    });
  });

  describe('countEntries', () => {
    it('should return zero for a fresh database', () => {
      expect(service.countEntries()).toBe(0);
    });

    it('should return the number of entries', () => {
      service.create('one');
      service.create('two');
      service.create('three');

      expect(service.countEntries()).toBe(3);
    });
  });
});
