import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Test as NestTest, TestingModule } from '@nestjs/testing';
import type { DataSource } from 'typeorm';

// ADR-010 exists to stop this application changing its own schema, and its
// single most important line is `synchronize: false`. Setting it back to `true`
// during the Day 8 audit produced:
//
//     lint ✅   typecheck ✅   build ✅   96 unit ✅   32 e2e ✅
//
// Nothing failed. The rule lived in a comment in `database.module.ts` and in a
// paragraph of an ADR, and in nothing that runs. That is the third consecutive
// day the same shape has appeared — Day 6's deleted `validate,`, Day 7's
// removed `APP_PIPE`, now this — and it is the worst of the three, because the
// other two skip a check while this one silently rewrites tables. TypeORM reads
// the entity classes on every boot and reshapes the database to match: a column
// renamed in TypeScript becomes a column dropped in SQLite, with the data in
// it, and the log line saying so scrolls past between two ordinary startup
// messages.
//
// `src/database/database.module.spec.ts` states the rule against
// `buildDatabaseOptions`, which is the function that decides it. This file is
// the other half, and the reason it is needed is that the unit test can only
// see that one function. `TypeOrmModule.forRootAsync`'s factory spreads its
// result and then adds `retryAttempts`, and anything else added after that
// spread wins — so `{ ...buildDatabaseOptions(...), synchronize: true }` leaves
// the unit test green and the application rewriting schemas. Only the assembled
// application can be asked what it actually ended up holding.
//
// It lives in `test/` for the same reason `config-wiring.e2e-spec.ts` does:
// this is where the real `AppModule` is loaded, so it is the only place that
// can observe production wiring at all.
describe('schema changes at boot (e2e)', () => {
  let environmentBeforeThisTest: NodeJS.ProcessEnv;
  let directory: string;
  let databaseFile: string;

  beforeEach(() => {
    environmentBeforeThisTest = { ...process.env };
    directory = mkdtempSync(join(tmpdir(), 'neuron-synchronize-'));

    // A zero-length file is a valid, empty SQLite database — no tables, no
    // `migrations` table, nothing. Creating it up front rather than letting
    // TypeORM create it keeps the ADR-007 "no database exists" warning, which
    // is correct but is noise here, out of the test output.
    //
    // This file existing is also the whole of the safety argument. Every other
    // spec swaps the connection with
    // `.overrideProvider(getDataSourceToken())`; this one deliberately does
    // not, because a replaced connection is not the connection whose options
    // are in question. So the real factory runs, and `DATABASE_PATH` is what
    // stops it opening `apps/api/data/neuron.db` — the developer's actual
    // journal, and the mistake ADR-007 records this suite making once already.
    databaseFile = join(directory, 'neuron.db');
    writeFileSync(databaseFile, '');
  });

  afterEach(() => {
    for (const name of Object.keys(process.env)) {
      if (!(name in environmentBeforeThisTest)) {
        delete process.env[name];
      }
    }
    Object.assign(process.env, environmentBeforeThisTest);
    rmSync(directory, { recursive: true, force: true });
  });

  // The same mechanism `config-wiring.e2e-spec.ts` explains at length, and for
  // the same reason. `ConfigModule.forRoot({ validate })` runs its check while
  // `app.module.ts` is being *imported*, so a static import at the top of this
  // file would read `process.env` once — before `beforeEach` set
  // `DATABASE_PATH` — and the factory would then open the default database.
  // `jest.resetModules()` and a fresh `require` are what make the application
  // built below genuinely new, and genuinely pointed at the temporary file.
  //
  // `Test` and `getDataSourceToken` have to come from the same reset as
  // `AppModule`. A `Test` imported statically holds a different copy of
  // `@nestjs/core` and Nest cannot match the `ModuleRef` class the container
  // has against the one `TypeOrmCoreModule` asks for; a `getDataSourceToken`
  // imported statically returns a different `DataSource` class object, which is
  // a token the container has never heard of and `module.get` throws on.
  const buildTheRealApplication = async (): Promise<{
    application: TestingModule;
    dataSource: DataSource;
  }> => {
    jest.resetModules();

    /* eslint-disable @typescript-eslint/no-require-imports */
    const { AppModule } = require('./../src/app.module') as {
      AppModule: new () => unknown;
    };
    const { Test } = require('@nestjs/testing') as { Test: typeof NestTest };
    const { getDataSourceToken } = require('@nestjs/typeorm') as {
      getDataSourceToken: () => string;
    };
    /* eslint-enable @typescript-eslint/no-require-imports */

    const application = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    return {
      application,
      dataSource: application.get<DataSource>(getDataSourceToken()),
    };
  };

  // The rule, stated against the connection the application is actually
  // holding — not against `buildDatabaseOptions`, and not against a copy of its
  // options written out in this file. `dataSource.options` is what TypeORM was
  // handed after every factory, spread and override in the graph had its say.
  it('should hold a connection with synchronize switched off', async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_PATH = databaseFile;

    const { application, dataSource } = await buildTheRealApplication();

    try {
      // `toBe(false)` rather than `toBeFalsy()`, because deleting the line
      // leaves it `undefined` — which TypeORM happens to treat as off, so a
      // looser assertion would pass on a file that no longer states the rule at
      // all. Day 6's finding was a deletion, not a change.
      expect(dataSource.options.synchronize).toBe(false);

      // The same comment's other half. `migrationsRun` is TypeORM's "apply any
      // pending migrations while starting", and it is off on purpose: applying
      // a migration is something a person does with `pnpm migration:run`, not
      // something a deployment does to a production database while nobody is
      // watching.
      expect(dataSource.options.migrationsRun).not.toBe(true);
    } finally {
      await application.close();
    }
  });

  // The claim above says what the configuration is. This one says what it does,
  // and it is the assertion that would still be true if TypeORM renamed the
  // option tomorrow.
  //
  // The database handed to the application is empty — a zero-length file, no
  // tables at all. Booting against it must leave it empty, because this
  // application's only way to create a table is a migration somebody ran on
  // purpose. With `synchronize: true` TypeORM reads `JournalEntry` and `User`
  // on the way up and creates `entries` and `users` before the first request
  // arrives, and this test fails on the table list rather than on an option
  // name.
  it('should leave an empty database empty after booting', async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_PATH = databaseFile;

    const { application, dataSource } = await buildTheRealApplication();

    try {
      const tables = await dataSource.query<{ name: string }[]>(
        `SELECT name FROM sqlite_master WHERE type = 'table'`,
      );

      expect(tables.map((table) => table.name)).toEqual([]);
    } finally {
      await application.close();
    }
  });
});
