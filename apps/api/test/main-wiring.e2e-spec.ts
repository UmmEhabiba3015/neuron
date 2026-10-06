import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/*
 * Every other suite builds the application itself and calls configureHttp on
 * it, so none of them can tell whether main.ts does. This one starts main.ts
 * as a real process and asks it over a real socket.
 *
 * It is slow for one assertion, and it is the only test in the project that
 * executes main.ts at all.
 */
const WEB_ORIGIN = 'http://localhost:3001';

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

describe('main.ts wiring (e2e)', () => {
  let directory: string;
  let server: ChildProcess;
  let output = '';
  let baseUrl: string;

  const preflight = () =>
    fetch(`${baseUrl}/entries`, {
      method: 'OPTIONS',
      headers: {
        Origin: WEB_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'neuron-main-wiring-'));
    const databaseFile = join(directory, 'neuron.db');
    writeFileSync(databaseFile, '');

    const port = await findAFreePort();
    baseUrl = `http://127.0.0.1:${port}`;

    server = spawn(
      process.execPath,
      ['-r', 'ts-node/register/transpile-only', 'src/main.ts'],
      {
        cwd: join(__dirname, '..'),
        env: {
          PATH: process.env.PATH,
          PORT: String(port),
          DATABASE_PATH: databaseFile,
          JWT_SECRET: 'test-only-signing-secret-never-use-this-anywhere-real',
          WEB_ORIGIN,
        },
      },
    );
    server.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
    server.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));

    const deadline = Date.now() + 25_000;

    for (;;) {
      try {
        await preflight();
        return;
      } catch {
        if (server.exitCode !== null || Date.now() > deadline) {
          throw new Error(`main.ts did not start listening:\n${output}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }, 30_000);

  afterAll(async () => {
    if (server.exitCode === null) {
      const exited = new Promise((resolve) => server.once('exit', resolve));

      server.kill();
      await exited;
    }

    rmSync(directory, { recursive: true, force: true });
  });

  it('should answer a preflight from the web origin, which only configureHttp makes possible', async () => {
    const response = await preflight();

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      WEB_ORIGIN,
    );
    expect(response.headers.get('access-control-allow-credentials')).toBe(
      'true',
    );
  });
});
