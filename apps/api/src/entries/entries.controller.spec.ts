import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

// `describe` groups related tests under a label, `it` is a single test case,
// and `expect` states one claim about a value — the test fails the moment a
// claim is false. Nested `describe` blocks only shape the output; they don't
// change how anything runs.
describe('EntriesController', () => {
  let controller: EntriesController;

  // `beforeEach` runs before *every* `it` below, rebuilding the controller
  // from scratch each time. That isolation is the point: state left behind by
  // one test can't leak into the next, so tests stay independently readable
  // and their execution order never matters.
  beforeEach(async () => {
    // The controller doesn't construct itself — it declares in its constructor
    // that it needs an `EntriesService`, and Nest's dependency injection
    // supplies one. `createTestingModule` builds a miniature Nest application
    // holding just the pieces this test needs, and `.compile()` resolves that
    // wiring. `new EntriesController(...)` would work today, but it would test
    // a construction path production never uses.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [EntriesService],
    }).compile();

    // `module.get<T>()` retrieves a fully-constructed instance out of that
    // container — the same object Nest would hand a real HTTP request, with
    // its service dependency already injected.
    controller = module.get<EntriesController>(EntriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    // This asserts the *shape and invariants* of the response rather than
    // counting it. A `toHaveLength(2)` check would couple the test to the seed
    // data — adding a third entry would turn it red with nothing broken. Note
    // also what isn't asserted: TypeScript already guarantees the field types
    // at this boundary, so the assertions spend themselves on the rules types
    // can't express.
    it('should return entries that each satisfy the JournalEntry contract', () => {
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
});
