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
