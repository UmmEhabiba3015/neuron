import { DatabaseSync } from 'node:sqlite';
import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE } from '../database/database.module';
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
        // Same token, different value. The service asks for DATABASE and has
        // no idea it's been handed a throwaway.
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
});
