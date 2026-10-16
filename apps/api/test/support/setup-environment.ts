import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.JWT_SECRET ??=
  'test-only-signing-secret-never-use-this-anywhere-real';

process.env.WEB_ORIGIN ??= 'http://localhost:3001';

/*
 * The suites use an in-memory database, so the default folder for audio,
 * beside the default database, would be the owner's own apps/api/data/audio.
 * Each suite gets a folder of its own instead.
 */
process.env.AUDIO_PATH ??= mkdtempSync(join(tmpdir(), 'neuron-e2e-audio-'));
