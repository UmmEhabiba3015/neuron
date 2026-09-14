import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

  it('should prefer a real environment variable over the .env file', () => {
    expect(portSeenByAFreshProcess({ PORT: '9999' })).toBe('9999');
  });

  it('should start normally when there is no .env file at all', () => {
    rmSync(envFile);

    expect(portSeenByAFreshProcess({})).toBe('undefined');
    expect(portSeenByAFreshProcess({ PORT: '9999' })).toBe('9999');
  });
});
