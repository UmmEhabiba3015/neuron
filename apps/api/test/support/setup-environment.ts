import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.JWT_SECRET ??=
  'test-only-signing-secret-never-use-this-anywhere-real';

process.env.WEB_ORIGIN ??= 'http://localhost:3001';

/*
 * The configuration requires DATABASE_URL, and startApp swaps the database
 * for the test file's own, so this address is never opened. It names a
 * database that does not exist, so that anything that did open it would
 * fail rather than write to the journal in the server's own database.
 */
process.env.DATABASE_URL ??= (() => {
  const url = new URL(
    process.env.TEST_DATABASE_URL ??
      'postgres://neuron:neuron@localhost:5432/neuron',
  );
  url.pathname = '/neuron_test_never_opened';

  return url.toString();
})();

/*
 * The default folder for audio is the owner's own apps/api/data/audio. Each
 * suite gets a folder of its own instead.
 */
process.env.AUDIO_PATH ??= mkdtempSync(join(tmpdir(), 'neuron-e2e-audio-'));
