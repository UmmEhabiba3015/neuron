import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AudioKeysRepository } from './audio-keys.repository';
import { AudioStorage } from './audio-storage';

/*
 * The sweep at start (ADR-024). It removes every file in the audio folder
 * that no entries row points at, soft-deleted rows included: the leftovers
 * of an account deletion that crashed after its commit, and of uploads whose
 * row was never written (ADR-023).
 *
 * It runs only before the API listens. Nest calls onApplicationBootstrap
 * from app.init(), and app.listen() awaits app.init() before it opens the
 * port. While the API is serving, an upload writes its file a moment before
 * its row, and a sweep in that moment would remove a file about to be used.
 *
 * A soft-deleted memo keeps its file, because its row is kept until the
 * account goes (ADR-020), and the account's deletion removes the file then.
 */
@Injectable()
export class AudioSweep implements OnApplicationBootstrap {
  private readonly logger = new Logger(AudioSweep.name);

  constructor(
    private readonly storage: AudioStorage,
    private readonly audioKeys: AudioKeysRepository,
  ) {}

  onApplicationBootstrap(): Promise<number> {
    return this.sweep();
  }

  /*
   * The number of files removed. A file that cannot be removed is logged and
   * left, and the start goes on: it is found again at the next start, and a
   * journal that will not open over one stray file helps nobody.
   */
  async sweep(): Promise<number> {
    const kept = await this.audioKeys.all();
    let removed = 0;

    for (const key of await this.storage.keys()) {
      if (kept.has(key)) {
        continue;
      }

      try {
        await this.storage.remove(key);
        removed += 1;
      } catch (error: unknown) {
        this.logger.warn(
          `Could not remove the audio file ${key}, which no entry points at: ${String(error)}`,
        );
      }
    }

    if (removed > 0) {
      this.logger.log(
        `Removed ${removed} audio file${removed === 1 ? '' : 's'} that no entry points at`,
      );
    }

    return removed;
  }
}
