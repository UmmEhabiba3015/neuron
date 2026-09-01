import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// This file tests a guarantee the design leans on rather than code this project
// wrote, and that is the reason it exists. The plan is that `.env` supplies
// values on a laptop while production ships no `.env` at all and the hosting
// platform sets real environment variables instead — one codebase reading both.
// That only holds if the real variable wins, so the claim is checked here
// instead of assumed (ADR-007).
//
// Each case runs a real child process, because loading happens at Node's own
// startup and cannot be observed from inside a process that has already
// started. The child prints the value it ended up with; the child's
// environment is passed explicitly, so nothing leaks in from the test runner.
describe('.env loading (node --env-file-if-exists)', () => {
  let directory: string;
  let envFile: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'neuron-env-file-'));
    envFile = join(directory, '.env');
    writeFileSync(envFile, 'PORT=5555\n');
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const portSeenByAFreshProcess = (environment: NodeJS.ProcessEnv): string =>
    execFileSync(
      process.execPath,
      [
        `--env-file-if-exists=${envFile}`,
        '-e',
        'console.log(process.env.PORT)',
      ],
      { env: environment, encoding: 'utf8' },
    ).trim();

  it('should take the value from the .env file when nothing else set it', () => {
    expect(portSeenByAFreshProcess({})).toBe('5555');
  });

  // The precedence the whole arrangement rests on. A real environment variable
  // is never overwritten by the file, which is what lets a deployment override
  // a developer's local value without the code knowing the difference.
  it('should prefer a real environment variable over the .env file', () => {
    expect(portSeenByAFreshProcess({ PORT: '9999' })).toBe('9999');
  });

  // Note the flag: `--env-file-if-exists`, not `--env-file`. `.env` is
  // gitignored, so a freshly cloned repository has none, and the strict form
  // would make `pnpm dev` fail on a clean checkout — precisely the unhelpful
  // startup failure this day set out to remove. A missing file is a silence,
  // not an error.
  it('should start normally when there is no .env file at all', () => {
    rmSync(envFile);

    expect(portSeenByAFreshProcess({})).toBe('undefined');
    expect(portSeenByAFreshProcess({ PORT: '9999' })).toBe('9999');
  });
});
