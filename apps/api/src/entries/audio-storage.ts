import { mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { DEFAULT_DATABASE_PATH } from '../database/database.module';

/*
 * Where the audio of voice memos is kept (ADR-023). The rest of the API asks
 * this to write a file or to read one back, and does not know where or how
 * it is kept: the same pattern as MailService (ADR-022). There is nothing
 * else it can do. In particular it cannot list or serve its folder.
 *
 * Until feature 8 the files are in one folder on the API's own disk. The
 * folder is made when the API starts, so a path that cannot be a folder
 * stops the start (ADR-007) and is not found by the first recording.
 *
 * A key is always one the API made, a random id. It is checked here all the
 * same, so that nothing that reaches this class can name a file outside the
 * folder.
 */
export class AudioStorage {
  constructor(private readonly folder: string) {
    mkdirSync(folder, { recursive: true });
  }

  /*
   * 'wx' refuses to replace a file that is already there. A key is never
   * used twice, so a file in the way means something is wrong.
   */
  async write(key: string, bytes: Buffer): Promise<void> {
    await writeFile(this.pathOf(key), bytes, { flag: 'wx' });
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.pathOf(key));
  }

  private pathOf(key: string): string {
    if (!AUDIO_KEY.test(key)) {
      throw new Error(`Not an audio key: ${JSON.stringify(key)}`);
    }

    return join(this.folder, key);
  }
}

/* What crypto.randomUUID() makes, and nothing else. */
const AUDIO_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/*
 * The folder. AUDIO_PATH, when it is set, is resolved from the working
 * directory, as DATABASE_PATH is. When it is not, the folder is "audio",
 * beside the database the API opens: apps/api/data/audio by default, and
 * beside a database chosen with DATABASE_PATH otherwise, so that a
 * throwaway database never shares its recordings with the real one.
 */
export function resolveAudioPath(
  configuredPath: string | undefined,
  databasePath: string | undefined,
): string {
  if (configuredPath !== undefined) {
    return resolve(process.cwd(), configuredPath);
  }

  const database =
    databasePath === undefined
      ? DEFAULT_DATABASE_PATH
      : resolve(process.cwd(), databasePath);

  return join(dirname(database), 'audio');
}
