import { DatabaseSync } from 'node:sqlite';
import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE } from '../database/database.module';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';

// `describe` groups related tests under a label, `it` is a single test case,
// and `expect` states one claim about a value — the test fails the moment a
// claim is false. Nested `describe` blocks only shape the output; they don't
// change how anything runs.
describe('EntriesController', () => {
  let controller: EntriesController;
  let db: DatabaseSync;

  // `beforeEach` runs before *every* `it` below, rebuilding the controller
  // from scratch each time. That isolation is the point: state left behind by
  // one test can't leak into the next, so tests stay independently readable
  // and their execution order never matters. Now that the data outlives a
  // single method call, that isolation has to reach the database too — hence a
  // fresh in-memory one per test.
  beforeEach(async () => {
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE entries (
        id         TEXT PRIMARY KEY,
        content    TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // The controller doesn't construct itself — it declares in its constructor
    // that it needs an `EntriesService`, and Nest's dependency injection
    // supplies one. `createTestingModule` builds a miniature Nest application
    // holding just the pieces this test needs, and `.compile()` resolves that
    // wiring. `new EntriesController(...)` would work today, but it would test
    // a construction path production never uses.
    //
    // That wiring is also what lets the real service run against a throwaway
    // database: the repository below it asks for the DATABASE token, and this
    // list decides what that token means here. The chain is three links long
    // now — controller → service → repository — and every link has to be
    // listed, because Nest constructs each one from this list alone.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        EntriesService,
        EntriesRepository,
        { provide: DATABASE, useValue: db },
      ],
    }).compile();

    // `module.get<T>()` retrieves a fully-constructed instance out of that
    // container — the same object Nest would hand a real HTTP request, with
    // its service dependency already injected.
    controller = module.get<EntriesController>(EntriesController);
  });

  afterEach(() => {
    db.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    // This asserts the *shape and invariants* of the response rather than
    // counting it. A `toHaveLength(2)` check would couple the test to whatever
    // happens to be stored — it broke the moment the seed data went away, which
    // is exactly the failure mode it was written to avoid. Note also what isn't
    // asserted: TypeScript already guarantees the field types at this boundary,
    // so the assertions spend themselves on the rules types can't express.
    it('should return entries that each satisfy the JournalEntry contract', () => {
      // The database no longer arrives pre-populated, so the test has to
      // create its own precondition through the same public API it exercises.
      controller.create({ content: 'an entry to have something to assert on' });

      const result = controller.findAll();

      // Without this, an empty array would pass every per-entry check below
      // by never running one.
      expect(result.length).toBeGreaterThan(0);

      for (const entry of result) {
        expect(entry.id.length).toBeGreaterThan(0);
        expect(entry.content.length).toBeGreaterThan(0);
        // `createdAt` is a string on the wire, so "is this a date" can only
        // mean "does it parse as one" — `Date.parse` yields NaN when it
        // doesn't.
        expect(Number.isNaN(Date.parse(entry.createdAt))).toBe(false);
      }
    });
  });

  describe('create', () => {
    it('should return the created entry rather than nothing', () => {
      const created = controller.create({ content: 'returned to the client' });

      expect(created.content).toBe('returned to the client');
      // These are the fields the client cannot know unless the response
      // carries them back, which is the whole reason this handler returns.
      expect(created.id.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    });

    it('should hand the created entry to findAll', () => {
      const created = controller.create({ content: 'should be readable back' });

      expect(controller.findAll()).toContainEqual(created);
    });
  });
});
