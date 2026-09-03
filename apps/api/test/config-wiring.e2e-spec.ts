import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Test as NestTest, TestingModule } from '@nestjs/testing';

// `src/config/env.validation.spec.ts` proves every rule is correct. It cannot
// prove anything calls them. Deleting the single word `validate,` from
// `ConfigModule.forRoot` left typecheck, build, 80 unit tests and 21 end-to-end
// tests all green on an application where `PORT=hello` still started happily and
// created a Unix socket file called `hello` — the whole of Day 6 present,
// tested, and disconnected. This is the same shape as the Day 4 finding, where
// removing `EntriesRepository` from a module's `providers` left 29 unit tests
// passing on a server that would not boot. Unit tests verify the pieces work;
// this file verifies the pieces are joined together (ADR-007).
//
// It lives in `test/` rather than `src/` for the same reason the existing
// end-to-end suite does: this is the only place that loads the real `AppModule`,
// and therefore the only place that can observe production wiring at all.
describe('configuration wiring (e2e)', () => {
  let environmentBeforeThisTest: NodeJS.ProcessEnv;
  let directory: string;

  beforeEach(() => {
    environmentBeforeThisTest = { ...process.env };
    directory = mkdtempSync(join(tmpdir(), 'neuron-config-wiring-'));
  });

  // A variable left behind here would change the answer of whichever spec Jest
  // happened to run next, and this project already has a written finding about
  // tests whose result depends on something other than the code. Restoring key
  // by key rather than reassigning `process.env` also puts back anything
  // @nestjs/config wrote into it, which it does: it copies whatever `validate`
  // returns back over the real environment.
  afterEach(() => {
    for (const name of Object.keys(process.env)) {
      if (!(name in environmentBeforeThisTest)) {
        delete process.env[name];
      }
    }
    Object.assign(process.env, environmentBeforeThisTest);
    rmSync(directory, { recursive: true, force: true });
  });

  // The one piece of mechanism this whole file depends on, and it is not
  // obvious. `ConfigModule.forRoot` is an `async` static, and it calls
  // `validate` in the synchronous part of its body — before its first `await` —
  // so the check runs while `app.module.ts` is being *imported*, not while Nest
  // is initialising. Because it is async, the failure arrives as a rejected
  // promise rather than a thrown error, which is why importing the module looks
  // like it succeeded and why the message only surfaces when Nest awaits it.
  //
  // The consequence is that a normal `import { AppModule }` at the top of this
  // file would run the check exactly once, against the environment as it was
  // before any test set a variable, and every assertion below would then be
  // made against a memoised result. That version of this file passes with
  // `validate,` deleted, which is precisely the failure it was written to
  // catch. `jest.resetModules()` and a fresh `require` are what make each test
  // build a genuinely new application.
  const buildTheRealApplication = async (): Promise<TestingModule> => {
    jest.resetModules();

    // A static import is hoisted and cached, and this test needs the module
    // evaluated again after `process.env` has been set. `await import(...)` is
    // still not used: the reason it was impossible has gone — Jest now runs
    // under `--experimental-vm-modules`, because `@nestjs/typeorm` ships as
    // ESM only — but `require` is what makes the reset above take effect
    // synchronously, and swapping it would change this file for no gain.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppModule } = require('./../src/app.module') as {
      AppModule: new () => unknown;
    };

    // `Test` has to come from the same reset as `AppModule`, and this is the
    // thing Day 8 broke. `jest.resetModules()` gives the required `AppModule` a
    // fresh copy of `@nestjs/core`; a `Test` imported at the top of the file
    // still holds the old one, so there are two `ModuleRef` classes and Nest
    // cannot match the one `TypeOrmCoreModule` asks for against the one the
    // container has. It failed with "can't resolve dependencies of the
    // TypeOrmCoreModule (TypeOrmModuleOptions, ?)". Nothing noticed before
    // because no provider in this application had ever injected `ModuleRef`.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Test } = require('@nestjs/testing') as {
      Test: typeof NestTest;
    };

    return Test.createTestingModule({ imports: [AppModule] }).compile();
  };

  // The message, not merely the fact that something threw. `toThrow()` with no
  // argument is satisfied by a `TypeError` from a typo in this file, which is
  // the weakness the Day 6 report identified in its own first draft.
  it('should refuse to build when PORT is invalid', async () => {
    process.env.PORT = 'hello';
    delete process.env.DATABASE_PATH;

    await expect(buildTheRealApplication()).rejects.toThrow(
      'PORT must be a whole number between 1 and 65535, received "hello"',
    );
  });

  it('should refuse to build when DATABASE_PATH is the empty string', async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_PATH = '';

    await expect(buildTheRealApplication()).rejects.toThrow(
      'DATABASE_PATH must be a non-empty path, received ""',
    );
  });

  // This claim looks redundant next to the two above and is not, and the reason
  // is the entire point of it being here.
  //
  // Every other end-to-end test that builds `AppModule` first calls
  // `.overrideProvider(getDataSourceToken()).useValue(dataSource)`, which
  // replaces the whole factory — and that factory is the only thing in the
  // application that asks for `ConfigService`. Replace it and the edge from the
  // database to the configuration is never travelled. Deleting `isGlobal: true`
  // therefore gives passing typecheck, passing build, 80 passing unit tests and
  // 21 passing end-to-end tests while the real application exits 1 with `Nest
  // can't resolve dependencies of the TypeOrmModuleOptions`. The two tests above
  // do not catch it either, because `validate` throws long before Nest reaches
  // dependency resolution, so they see the message they are asserting on and go
  // green.
  //
  // The override changed shape on Day 8 and the hole it leaves did not, which
  // is why this test needed no new claim to go on covering it.
  //
  // Building the real thing with valid configuration and no overrides is the
  // only thing that walks that edge.
  it('should build the real application when the configuration is valid', async () => {
    // Configuration, not an override: the provider graph is untouched and the
    // factory runs for real. Pointing it at a temporary file is what stops the
    // test opening the developer's actual journal, which is the mistake ADR-007
    // records the suite making once already. The empty file is created first
    // because SQLite treats a zero-length file as an empty database, and it
    // keeps the "no database exists" warning — correct, but noise here — out of
    // the test output.
    const databaseFile = join(directory, 'neuron.db');
    writeFileSync(databaseFile, '');
    process.env.PORT = '3000';
    process.env.DATABASE_PATH = databaseFile;

    const application = await buildTheRealApplication();

    // The factory opened a real connection, and closing the application is now
    // enough to close it. It was not before: `DATABASE` was a plain value
    // provider with no lifecycle hook, so this test had to reach into the
    // container, fetch the Symbol from the same freshly-required copy of the
    // module, and call `close()` by hand. `TypeOrmCoreModule` implements
    // `onApplicationShutdown` and destroys the DataSource itself, so eight
    // lines of teardown became one — the first thing TypeORM gave back rather
    // than took (ADR-010).
    await application.close();
  });
});
