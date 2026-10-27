import { mkdirSync } from 'node:fs';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/*
 * Where the audio of voice memos is kept (ADR-023). The rest of the API asks
 * this to write a file or to read one back, and does not know where or how
 * it is kept: the same pattern as MailService (ADR-022). It can also remove
 * a file, when an account is deleted, and name the files it holds, for the
 * sweep at start (ADR-024). It never serves its folder.
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

  /*
   * A file that is already gone is not an error: what was asked for is
   * true. Any other failure is the caller's to hear about.
   */
  async remove(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true });
  }

  /*
   * The keys of the files in the folder. Only names that are one of the
   * API's own keys are listed: anything else in the folder was not put there
   * by the API, and the sweep leaves it alone.
   */
  async keys(): Promise<string[]> {
    const found = await readdir(this.folder, { withFileTypes: true });

    return found
      .filter((each) => each.isFile() && AUDIO_KEY.test(each.name))
      .map((each) => each.name);
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
 * The folder when AUDIO_PATH is not set: apps/api/data/audio, wherever the
 * API was started from. It was "audio" beside the SQLite file until the move
 * to Postgres, which left no database file for it to sit beside.
 */
export const DEFAULT_AUDIO_PATH = resolve(__dirname, '../..', 'data/audio');

/*
 * The folder. AUDIO_PATH, when it is set, is resolved from the working
 * directory. When it is not, the folder is DEFAULT_AUDIO_PATH.
 */
export function resolveAudioPath(configuredPath: string | undefined): string {
  return configuredPath === undefined
    ? DEFAULT_AUDIO_PATH
    : resolve(process.cwd(), configuredPath);
}
