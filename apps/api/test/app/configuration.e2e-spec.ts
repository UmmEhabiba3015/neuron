import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Test as NestTest, TestingModule } from '@nestjs/testing';
import type { DataSource } from 'typeorm';
import { createEmptyDatabase } from '../support/test-database';

/*
 * ADR-007: configuration is checked once, at start, and a bad value stops
 * the application before it serves anything. Each rule about each variable
 * is a unit test in env.validation.spec.ts and database.module.spec.ts. These
 * build the real AppModule, with no database swapped in, to show the rules
 * are the ones it starts with.
 */
describe('configuration at start (e2e)', () => {
  let environmentBeforeThisTest: NodeJS.ProcessEnv;
  let directory: string;
  let databaseUrl: string;

  beforeAll(async () => {
    databaseUrl = await createEmptyDatabase();
  });

  beforeEach(() => {
    environmentBeforeThisTest = { ...process.env };
    directory = mkdtempSync(join(tmpdir(), 'neuron-configuration-'));
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

  /*
   * Loaded afresh each time, because ConfigModule reads process.env when
   * the module is first imported.
   */
  const buildTheRealApplication = async (): Promise<TestingModule> => {
    jest.resetModules();

    /* eslint-disable @typescript-eslint/no-require-imports */
    const { AppModule } = require('../../src/app.module') as {
      AppModule: new () => unknown;
    };
    const { Test } = require('@nestjs/testing') as { Test: typeof NestTest };
    /* eslint-enable @typescript-eslint/no-require-imports */

    return Test.createTestingModule({ imports: [AppModule] }).compile();
  };

  it('refuses to start with a bad value, and names it', async () => {
    process.env.PORT = 'hello';
    process.env.DATABASE_URL = databaseUrl;

    await expect(buildTheRealApplication()).rejects.toThrow(
      'PORT must be a whole number between 1 and 65535, received "hello"',
    );

    process.env.PORT = '3000';
    delete process.env.WEB_ORIGIN;

    await expect(buildTheRealApplication()).rejects.toThrow(
      /^WEB_ORIGIN must be set/,
    );

    process.env.WEB_ORIGIN = 'http://localhost:3001';
    delete process.env.DATABASE_URL;

    await expect(buildTheRealApplication()).rejects.toThrow(
      /^DATABASE_URL must be set/,
    );
  });

  /*
   * ADR-010: the schema changes only through migrations. Starting the
   * application must not change it, however empty the database is.
   */
  it('starts with a valid configuration, and leaves the schema alone', async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_URL = databaseUrl;

    const application = await buildTheRealApplication();

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDataSourceToken } = require('@nestjs/typeorm') as {
        getDataSourceToken: () => string;
      };
      const dataSource = application.get<DataSource>(getDataSourceToken());

      expect(dataSource.options.synchronize).toBe(false);
      expect(dataSource.options.migrationsRun).not.toBe(true);

      const tables = await dataSource.query<{ name: string }[]>(
        `SELECT table_name AS name FROM information_schema.tables
          WHERE table_schema = 'public'`,
      );

      expect(tables).toEqual([]);
    } finally {
      await application.close();
    }
  });

  /*
   * The start scripts load ../../.env with node --env-file-if-exists. This
   * is Node's behaviour, checked because the project depends on all three
   * parts of it.
   */
  it('reads a .env file, lets a real variable win over it, and starts without one', () => {
    const envFile = join(directory, '.env');
    writeFileSync(envFile, 'PORT=5555\n');

    const portSeenByAFreshProcess = (environment: NodeJS.ProcessEnv): string =>
      execFileSync(
        process.execPath,
        [
          `--env-file-if-exists=${envFile}`,
          '-e',
          'console.log(process.env.PORT)',
        ],
        {
          env: environment,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        },
      ).trim();

    expect(portSeenByAFreshProcess({})).toBe('5555');
    expect(portSeenByAFreshProcess({ PORT: '9999' })).toBe('9999');

    rmSync(envFile);

    expect(portSeenByAFreshProcess({})).toBe('undefined');
    expect(portSeenByAFreshProcess({ PORT: '9999' })).toBe('9999');
  });
});
