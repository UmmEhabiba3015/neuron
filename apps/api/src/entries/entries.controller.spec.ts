import { DatabaseSync } from 'node:sqlite';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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

    // Content that merely contains whitespace is valid, and what the user wrote
    // is what gets stored. Whitespace decides validity; it never edits the text.
    it('should store valid content verbatim, without trimming', () => {
      const padded = '  the user chose this spacing  ';

      expect(controller.create({ content: padded }).content).toBe(padded);
    });
  });

  // These assert the exception *class*, which is what a unit test at this level
  // can see. That each class becomes the right number on the wire is a separate
  // claim, proven over real HTTP in test/app.e2e-spec.ts.
  describe('create validation', () => {
    it('should reject a body with no content field', () => {
      expect(() => controller.create({})).toThrow(BadRequestException);
    });

    // The case that looks pedantic and is not. SQLite's TEXT affinity would
    // coerce 42 into "42" on the way in, so the POST response and every later
    // GET would disagree about the type of the same entry's content.
    it('should reject content that is not a string', () => {
      expect(() => controller.create({ content: 42 })).toThrow(
        BadRequestException,
      );
    });

    it('should reject empty content', () => {
      expect(() => controller.create({ content: '' })).toThrow(
        BadRequestException,
      );
    });

    it('should reject content that is only whitespace', () => {
      expect(() => controller.create({ content: '   ' })).toThrow(
        BadRequestException,
      );
    });

    // Nothing rejected above may reach storage. Without this, all four checks
    // could pass while still having written a row.
    it('should not store anything it rejected', () => {
      expect(() => controller.create({ content: '   ' })).toThrow();

      expect(controller.findAll()).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return the entry that was created', () => {
      const created = controller.create({ content: 'findable by its id' });

      expect(controller.findById(created.id)).toEqual(created);
    });

    // The layer this behaviour lives in is the point. The service returns
    // `undefined` for a missing entry; translating that absence into a 404 is
    // this controller's job and only this controller's job (ADR-005).
    it('should throw NotFoundException when the id does not exist', () => {
      expect(() => controller.findById('no-such-id')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll by word', () => {
    // No matches is a complete answer, not an error — so this returns rather
    // than throws, and the HTTP status stays 200.
    it('should return an empty array when nothing matches', () => {
      controller.create({ content: 'quiet evening at home' });

      expect(controller.findAll('zzzzz')).toEqual([]);
    });
  });

  describe('countEntries', () => {
    // An object, not a bare number. A bare `0` is the only response on this
    // API that is neither an object nor an array of them, and it has no room
    // to gain a field later without breaking every existing client (ADR-005).
    it('should return the count wrapped in an object', () => {
      expect(controller.countEntries()).toEqual({ count: 0 });

      controller.create({ content: 'one' });
      controller.create({ content: 'two' });

      expect(controller.countEntries()).toEqual({ count: 2 });
    });
  });
});
