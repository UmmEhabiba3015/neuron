import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Test as NestTest, TestingModule } from '@nestjs/testing';

describe('configuration wiring (e2e)', () => {
  let environmentBeforeThisTest: NodeJS.ProcessEnv;
  let directory: string;

  beforeEach(() => {
    environmentBeforeThisTest = { ...process.env };
    directory = mkdtempSync(join(tmpdir(), 'neuron-config-wiring-'));
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

  const buildTheRealApplication = async (): Promise<TestingModule> => {
    jest.resetModules();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppModule } = require('./../src/app.module') as {
      AppModule: new () => unknown;
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Test } = require('@nestjs/testing') as {
      Test: typeof NestTest;
    };

    return Test.createTestingModule({ imports: [AppModule] }).compile();
  };

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

  it('should build the real application when the configuration is valid', async () => {
    const databaseFile = join(directory, 'neuron.db');
    writeFileSync(databaseFile, '');
    process.env.PORT = '3000';
    process.env.DATABASE_PATH = databaseFile;

    const application = await buildTheRealApplication();

    await application.close();
  });
});
