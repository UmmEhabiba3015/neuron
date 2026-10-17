import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DEFAULT_DATABASE_PATH } from '../database/database.module';
import { AudioStorage, resolveAudioPath } from './audio-storage';

describe('AudioStorage', () => {
  const KEY = '0b7f2a52-41f6-4d38-9a5e-1c2d3e4f5a6b';
  let directory: string;

  beforeEach(() => {
    directory = realpathSync(mkdtempSync(join(tmpdir(), 'neuron-storage-')));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('makes its folder when it is made, which is at start', () => {
    const folder = join(directory, 'not', 'yet', 'there');

    new AudioStorage(folder);

    expect(existsSync(folder)).toBe(true);
  });

  it('refuses to start when the path is a file, not a folder', () => {
    const file = join(directory, 'a-file');
    writeFileSync(file, '');

    expect(() => new AudioStorage(file)).toThrow();
  });

  it('reads back the bytes it wrote, from a file named by the key', async () => {
    const storage = new AudioStorage(directory);
    const bytes = Buffer.from([0, 1, 2, 250, 255]);

    await storage.write(KEY, bytes);

    expect(readdirSync(directory)).toEqual([KEY]);
    expect(await storage.read(KEY)).toEqual(bytes);
  });

  it('never replaces a file that is already there', async () => {
    const storage = new AudioStorage(directory);
    await storage.write(KEY, Buffer.from('first'));

    await expect(storage.write(KEY, Buffer.from('second'))).rejects.toThrow();
    expect((await storage.read(KEY)).toString()).toBe('first');
  });

  it('fails to read a key it has no file for', async () => {
    await expect(new AudioStorage(directory).read(KEY)).rejects.toThrow();
  });

  it('removes a file, and is content when the file is already gone', async () => {
    const storage = new AudioStorage(directory);
    await storage.write(KEY, Buffer.from('x'));

    await storage.remove(KEY);
    await storage.remove(KEY);

    expect(readdirSync(directory)).toEqual([]);
  });

  it('names the files it holds, and nothing in its folder that it did not put there', async () => {
    const storage = new AudioStorage(directory);
    const other = '1c2d3e4f-0000-4000-8000-0b7f2a5241f6';
    await storage.write(KEY, Buffer.from('x'));
    await storage.write(other, Buffer.from('y'));
    writeFileSync(join(directory, 'notes.txt'), '');
    mkdirSync(join(directory, '0b7f2a52-41f6-4d38-9a5e-000000000000'));

    expect((await storage.keys()).sort()).toEqual([KEY, other].sort());
  });

  it.each(['../neuron.db', 'recording.webm', '', `${KEY}/../x`])(
    'refuses a key that is not one of its own ids: %p',
    async (key) => {
      const storage = new AudioStorage(directory);

      await expect(storage.write(key, Buffer.from('x'))).rejects.toThrow(
        /Not an audio key/,
      );
      await expect(storage.read(key)).rejects.toThrow(/Not an audio key/);
      await expect(storage.remove(key)).rejects.toThrow(/Not an audio key/);
    },
  );
});

describe('resolveAudioPath', () => {
  let directory: string;

  beforeEach(() => {
    directory = realpathSync(mkdtempSync(join(tmpdir(), 'neuron-audio-path-')));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const inDirectory = (run: () => string): string => {
    const previous = process.cwd();
    process.chdir(directory);

    try {
      return run();
    } finally {
      process.chdir(previous);
    }
  };

  it('is "audio" beside the default database when neither path is set', () => {
    expect(resolveAudioPath(undefined, undefined)).toBe(
      join(dirname(DEFAULT_DATABASE_PATH), 'audio'),
    );
  });

  it('is "audio" beside a database chosen with DATABASE_PATH', () => {
    expect(
      inDirectory(() => resolveAudioPath(undefined, 'scratch/worker.db')),
    ).toBe(join(directory, 'scratch', 'audio'));
  });

  it('is AUDIO_PATH, resolved from the working directory, when it is set', () => {
    expect(
      inDirectory(() => resolveAudioPath('memos', 'scratch/worker.db')),
    ).toBe(join(directory, 'memos'));
  });
});
