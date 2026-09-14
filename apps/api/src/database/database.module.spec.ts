import {
  existsSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { migrations } from './migrations';
import {
  DEFAULT_DATABASE_PATH,
  buildDatabaseOptions,
  resolveDatabasePath,
} from './database.module';

describe('resolveDatabasePath', () => {
  let warn: jest.SpyInstance;
  let directory: string;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    directory = realpathSync(
      mkdtempSync(join(tmpdir(), 'neuron-database-path-')),
    );
  });

  afterEach(() => {
    warn.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  });

  describe('which file gets opened', () => {
    it('should use the default when DATABASE_PATH was not set', () => {
      expect(resolveDatabasePath(undefined, DEFAULT_DATABASE_PATH)).toBe(
        DEFAULT_DATABASE_PATH,
      );
    });

    it('should resolve the default independently of the working directory', () => {
      const previous = process.cwd();
      process.chdir(directory);

      try {
        expect(resolveDatabasePath(undefined, DEFAULT_DATABASE_PATH)).toBe(
          DEFAULT_DATABASE_PATH,
        );
      } finally {
        process.chdir(previous);
      }
    });

    it('should resolve an explicit relative path from the working directory', () => {
      const previous = process.cwd();
      process.chdir(directory);

      try {
        expect(resolveDatabasePath('scratch.db', DEFAULT_DATABASE_PATH)).toBe(
          join(directory, 'scratch.db'),
        );
      } finally {
        process.chdir(previous);
      }
    });
  });

  describe('the warning about a missing database', () => {
    it('should warn when DATABASE_PATH names a file that is not there', () => {
      const mistyped = join(directory, 'nueron.db');

      resolveDatabasePath(mistyped, DEFAULT_DATABASE_PATH);

      expect(warn).toHaveBeenCalledTimes(1);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining(mistyped));
    });

    it('should stay quiet when the path was not set, though the file is equally missing', () => {
      const missingDefault = join(directory, 'neuron.db');
      expect(existsSync(missingDefault)).toBe(false);

      expect(resolveDatabasePath(undefined, missingDefault)).toBe(
        missingDefault,
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('should stay quiet when DATABASE_PATH names a file that does exist', () => {
      const existing = join(directory, 'neuron.db');
      writeFileSync(existing, '');

      resolveDatabasePath(existing, DEFAULT_DATABASE_PATH);

      expect(warn).not.toHaveBeenCalled();
    });
  });
});

describe('buildDatabaseOptions', () => {
  let warn: jest.SpyInstance;
  let directory: string;

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    directory = realpathSync(mkdtempSync(join(tmpdir(), 'neuron-options-')));
  });

  afterEach(() => {
    warn.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  });

  it('should never let TypeORM change the schema at boot', () => {
    const options = buildDatabaseOptions(join(directory, 'neuron.db'));

    expect(options.synchronize).toBe(false);
  });

  it('should not run migrations at boot either', () => {
    const options = buildDatabaseOptions(join(directory, 'neuron.db'));

    expect(options.migrationsRun).not.toBe(true);
  });

  it('should carry the migrations, so the CLI and the server agree', () => {
    const options = buildDatabaseOptions(join(directory, 'neuron.db'));

    expect(options.migrations).toBe(migrations);
  });
});
