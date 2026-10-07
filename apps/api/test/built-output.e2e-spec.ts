import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/*
 * Builds the API the way `pnpm build` does and starts the result the way
 * `pnpm start:prod` does, so that plain Node has to find @neuron/contracts by
 * itself at runtime.
 *
 * The contract's package.json has no "type" field, and that is deliberate.
 * Adding "type": "module" makes ts-node refuse the package, which breaks the
 * migration commands and the main-wiring suite.
 *
 * It builds for itself rather than trusting a dist folder that happens to be
 * there, which may be old or absent.
 */
const API = join(__dirname, '..');

const findAFreePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const probe = createServer();

    probe.once('error', reject);
    probe.listen(0, () => {
      const address = probe.address();

      probe.close(() =>
        typeof address === 'object' && address
          ? resolve(address.port)
          : reject(new Error('could not find a free port')),
      );
    });
  });

describe('the built API (e2e)', () => {
  let directory: string;
  let server: ChildProcess;
  let output = '';
  let baseUrl: string;

  const register = (password: string) =>
    fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'built@example.com',
        password,
        name: 'Built',
        timezone: 'UTC',
      }),
    });

  beforeAll(async () => {
    execFileSync(
      process.execPath,
      [join(API, 'node_modules/@nestjs/cli/bin/nest.js'), 'build'],
      { cwd: API, stdio: 'pipe' },
    );

    directory = mkdtempSync(join(tmpdir(), 'neuron-built-output-'));
    const databaseFile = join(directory, 'neuron.db');
    writeFileSync(databaseFile, '');

    const port = await findAFreePort();
    baseUrl = `http://127.0.0.1:${port}`;

    server = spawn(process.execPath, ['dist/main'], {
      cwd: API,
      env: {
        PATH: process.env.PATH,
        PORT: String(port),
        DATABASE_PATH: databaseFile,
        JWT_SECRET: 'test-only-signing-secret-never-use-this-anywhere-real',
        WEB_ORIGIN: 'http://localhost:3001',
      },
    });
    server.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
    server.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));

    const deadline = Date.now() + 25_000;

    for (;;) {
      try {
        await fetch(baseUrl);
        return;
      } catch {
        if (server.exitCode !== null || Date.now() > deadline) {
          throw new Error(`dist/main did not start listening:\n${output}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }, 90_000);

  afterAll(async () => {
    if (server && server.exitCode === null) {
      const exited = new Promise((resolve) => server.once('exit', resolve));

      server.kill();
      await exited;
    }

    if (directory) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('should put main.js where the start scripts look for it', () => {
    expect(existsSync(join(API, 'dist/main.js'))).toBe(true);
  });

  it('should leave the contract out of dist, to be found at runtime instead', () => {
    expect(existsSync(join(API, 'dist/apps'))).toBe(false);
    expect(existsSync(join(API, 'dist/packages'))).toBe(false);
  });

  /*
   * The 8 is written out here and not imported. This is the product's
   * expectation stated a second time on purpose: if the contract's number is
   * changed by mistake, this is one of the places that says so.
   */
  it('should answer with a number that only the contract holds', async () => {
    const response = await register('1234567');
    const body = (await response.json()) as { message: string[] };

    expect(response.status).toBe(400);
    expect(body.message).toEqual([
      'password must be longer than or equal to 8 characters',
    ]);
  });

  it('should start without a warning from Node about how it loaded the contract', () => {
    expect(output).not.toMatch(
      /MODULE_TYPELESS_PACKAGE_JSON|ExperimentalWarning/,
    );
  });
});
