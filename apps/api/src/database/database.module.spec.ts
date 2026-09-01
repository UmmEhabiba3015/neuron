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
import { DEFAULT_DATABASE_PATH, resolveDatabasePath } from './database.module';

// The rule these tests state is the one thing `env.validation.ts` cannot check.
// `DATABASE_PATH=data/nueron.db` is a typo that is a perfectly well-formed
// path, so no inspection of the string will ever reject it. The only way to
// notice is to look at the filesystem and say something out loud (ADR-007).
describe('resolveDatabasePath', () => {
  let warn: jest.SpyInstance;
  let directory: string;

  beforeEach(() => {
    // Recorded and silenced. These tests trigger the warning on purpose, and
    // letting it print would make a healthy run look like a broken one.
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    // `realpathSync` because /tmp is a symlink on some systems, and `resolve`
    // inside the function returns the real path — comparing the two without
    // this produces a failure that has nothing to do with the code.
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

    // The default is anchored to the module's own location, so it names the
    // same file no matter where the process was started from. Asserting that
    // it does not move when the working directory does is what distinguishes
    // it from the explicit case below.
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

    // An explicit relative path lands where the person who typed it expects:
    // beside them, in the directory they ran the command from. An
    // implementation that resolved this one from the source tree too would
    // fail here.
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

  // The pair below is the whole rule. Both tests point at a file that is
  // definitely missing — the temporary directory is created empty in
  // `beforeEach` — so the only difference between them is *who chose the
  // path*. That is what makes them a real check rather than two tests that
  // happen to agree with whatever is on this machine's disk.
  describe('the warning about a missing database', () => {
    it('should warn when DATABASE_PATH names a file that is not there', () => {
      const mistyped = join(directory, 'nueron.db');

      resolveDatabasePath(mistyped, DEFAULT_DATABASE_PATH);

      expect(warn).toHaveBeenCalledTimes(1);
      // The path has to appear in the message. "A database is missing" is not
      // something anybody can act on; "*this* database is missing" is.
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(mistyped));
    });

    // Creating the default database is what a first run does — on a freshly
    // cloned repository no database exists by definition. Warning about it
    // would fire on every clean checkout, and a warning nobody ever needs to
    // act on is the kind that teaches people to scroll past the real one.
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
