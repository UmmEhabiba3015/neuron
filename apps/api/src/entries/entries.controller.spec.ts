import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../../test/test-database';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.entity';

// `describe` groups related tests under a label, `it` is a single test case,
// and `expect` states one claim about a value — the test fails the moment a
// claim is false. Nested `describe` blocks only shape the output; they don't
// change how anything runs.
//
// What this file stopped being able to test on Day 7, and why that is correct.
//
// Until then it held thirteen claims about rejected input, all of the form
// `expect(() => controller.create({ content: 42 })).toThrow(...)`. Those rules
// now live on the DTO classes and are enforced by the `ValidationPipe`
// registered in `app.module.ts` — which runs between the network and this
// class, and therefore not at all when a test calls a method directly. Keeping
// those tests would have meant keeping tests that pass whatever the rules say,
// which is worse than not having them (ADR-008).
//
// They were not deleted so much as split in two, along the seam Day 6 found:
// the rules are asserted in `create-entry.dto.spec.ts`,
// `update-entry.dto.spec.ts` and `find-entries-query.dto.spec.ts`, and the fact
// that the application actually applies them is asserted over real HTTP in
// `test/app.e2e-spec.ts`.
//
// What is left here is what this class genuinely decides on its own: absence
// becoming a 404, the shape of the count response, and whether a search was
// asked for at all.
// Every handler returns a promise since Day 8, because TypeORM has no
// synchronous API, so every call below is awaited and every "it should throw"
// became "it should reject". The claims are word for word the ones that were
// here yesterday: a missing entry still produces a `NotFoundException`, and
// `rejects.toThrow(NotFoundException)` is how that sentence is written about a
// promise (ADR-010).
describe('EntriesController', () => {
  let controller: EntriesController;
  let dataSource: DataSource;

  // `beforeEach` runs before *every* `it` below, rebuilding the controller
  // from scratch each time. That isolation is the point: state left behind by
  // one test can't leak into the next, so tests stay independently readable
  // and their execution order never matters. Now that the data outlives a
  // single method call, that isolation has to reach the database too — hence a
  // fresh in-memory one per test.
  beforeEach(async () => {
    dataSource = await createTestDataSource();

    // The controller doesn't construct itself — it declares in its constructor
    // that it needs an `EntriesService`, and Nest's dependency injection
    // supplies one. `createTestingModule` builds a miniature Nest application
    // holding just the pieces this test needs, and `.compile()` resolves that
    // wiring. `new EntriesController(...)` would work today, but it would test
    // a construction path production never uses.
    //
    // That wiring is also what lets the real service run against a throwaway
    // database: the repository below it asks for the token that
    // `TypeOrmModule.forFeature([JournalEntry])` registers, and this list
    // decides what that token means here. The chain is three links long now —
    // controller → service → repository — and every link has to be listed,
    // because Nest constructs each one from this list alone.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        EntriesService,
        EntriesRepository,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: dataSource.getRepository(JournalEntry),
        },
      ],
    }).compile();

    // `module.get<T>()` retrieves a fully-constructed instance out of that
    // container — the same object Nest would hand a real HTTP request, with
    // its service dependency already injected.
    controller = module.get<EntriesController>(EntriesController);
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
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
    it('should return entries that each satisfy the JournalEntry contract', async () => {
      // The database no longer arrives pre-populated, so the test has to
      // create its own precondition through the same public API it exercises.
      await controller.create({
        content: 'an entry to have something to assert on',
      });

      const result = await controller.findAll({});

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
    it('should return the created entry rather than nothing', async () => {
      const created = await controller.create({
        content: 'returned to the client',
      });

      expect(created.content).toBe('returned to the client');
      // These are the fields the client cannot know unless the response
      // carries them back, which is the whole reason this handler returns.
      expect(created.id.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    });

    it('should hand the created entry to findAll', async () => {
      const created = await controller.create({
        content: 'should be readable back',
      });

      expect(await controller.findAll({})).toContainEqual(created);
    });

    // Content that merely contains whitespace is valid, and what the user wrote
    // is what gets stored. Whitespace decides validity; it never edits the text.
    it('should store valid content verbatim, without trimming', async () => {
      const padded = '  the user chose this spacing  ';

      expect((await controller.create({ content: padded })).content).toBe(
        padded,
      );
    });
  });

  describe('findById', () => {
    it('should return the entry that was created', async () => {
      const created = await controller.create({
        content: 'findable by its id',
      });

      expect(await controller.findById(created.id)).toEqual(created);
    });

    // The layer this behaviour lives in is the point. The service returns
    // `undefined` for a missing entry; translating that absence into a 404 is
    // this controller's job and only this controller's job (ADR-005).
    it('should throw NotFoundException when the id does not exist', async () => {
      await expect(controller.findById('no-such-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll by word', () => {
    // No matches is a complete answer, not an error — so this returns rather
    // than throws, and the HTTP status stays 200.
    it('should return an empty array when nothing matches', async () => {
      await controller.create({ content: 'quiet evening at home' });

      expect(await controller.findAll({ word: 'zzzzz' })).toEqual([]);
    });

    // The one search decision this class still makes, and the single most
    // likely thing in Day 7 to get wrong. An absent `word` and an empty one are
    // different messages: no `word` at all means "I am not searching, show me
    // everything", while `?word=` means "I am searching, and this is my term".
    //
    // Both halves are asserted in one test on purpose. `if (query.word)` — the
    // truthiness test this replaced — makes the two calls return the same
    // thing, and a run where they agree has failed even though each line looks
    // reasonable on its own (ADR-008, Decision 7).
    it('should list everything for an absent word and nothing for an empty one', async () => {
      const created = await controller.create({
        content: 'quiet evening at home',
      });

      expect(await controller.findAll({})).toEqual([created]);
      expect(await controller.findAll({ word: '' })).toEqual([]);
    });
  });

  describe('update', () => {
    it('should return the entry with its new content', async () => {
      const created = await controller.create({ content: 'the first draft' });

      const updated = await controller.update(created.id, {
        content: 'the second draft',
      });

      expect(updated.content).toBe('the second draft');
      expect((await controller.findById(created.id)).content).toBe(
        'the second draft',
      );
    });

    it('should leave createdAt unchanged', async () => {
      const created = await controller.create({ content: 'written once' });

      const updated = await controller.update(created.id, {
        content: 'edited later',
      });

      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('should throw NotFoundException when the id does not exist', async () => {
      await expect(
        controller.update('no-such-id', { content: 'anything' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should return the deleted entry and leave it gone', async () => {
      const created = await controller.create({ content: 'here for a moment' });

      expect(await controller.delete(created.id)).toEqual(created);
      await expect(controller.findById(created.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the id does not exist', async () => {
      await expect(controller.delete('no-such-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    // A `DELETE` against an id that was never there must not report success.
    // The SQL alone would not catch this: deleting nothing is not an error in
    // SQLite, so the row has to be read before it is removed.
    it('should not report success twice for the same entry', async () => {
      const created = await controller.create({ content: 'deleted once' });

      await controller.delete(created.id);

      await expect(controller.delete(created.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('countEntries', () => {
    // An object, not a bare number. A bare `0` is the only response on this
    // API that is neither an object nor an array of them, and it has no room
    // to gain a field later without breaking every existing client (ADR-005).
    it('should return the count wrapped in an object', async () => {
      expect(await controller.countEntries()).toEqual({ count: 0 });

      await controller.create({ content: 'one' });
      await controller.create({ content: 'two' });

      expect(await controller.countEntries()).toEqual({ count: 2 });
    });
  });
});
