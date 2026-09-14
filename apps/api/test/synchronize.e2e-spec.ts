import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Test as NestTest, TestingModule } from '@nestjs/testing';
import type { DataSource } from 'typeorm';

describe('schema changes at boot (e2e)', () => {
  let environmentBeforeThisTest: NodeJS.ProcessEnv;
  let directory: string;
  let databaseFile: string;

  beforeEach(() => {
    environmentBeforeThisTest = { ...process.env };
    directory = mkdtempSync(join(tmpdir(), 'neuron-synchronize-'));

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

  it('should hold a connection with synchronize switched off', async () => {
    process.env.PORT = '3000';
    process.env.DATABASE_PATH = databaseFile;

    const { application, dataSource } = await buildTheRealApplication();

    try {
      expect(dataSource.options.synchronize).toBe(false);

      expect(dataSource.options.migrationsRun).not.toBe(true);
    } finally {
      await application.close();
    }
  });

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
