/*
 * Playing a saved voice memo (features.md, Ref 23).
 *
 * The audio route needs the access token, which lives in memory (ADR-018),
 * and an <audio src> request cannot carry it. So the audio is asked for with
 * the token, as bytes, and handed to the player as a local object URL
 * (ADR-023). It is asked for only when play is first pressed, and once: a
 * second press plays what is already here. The URL is released when the
 * memo leaves the screen.
 *
 * Tested with Node alone: the request and the two URL functions are handed
 * in.
 */
import type { Request } from './today.ts';

export type NotPlayed = 'unreachable' | 'refused';

export type PlaybackState =
  | { status: 'idle' }
  | { status: 'fetching' }
  | { status: 'ready'; url: string }
  | { status: 'failed'; why: NotPlayed };

export interface ObjectUrls {
  create(blob: Blob): string;
  revoke(url: string): void;
}

export interface Playback {
  getState(): PlaybackState;
  subscribe(listener: () => void): () => void;
  /*
   * The URL to play, asked for the first time it is needed. undefined while
   * it is being asked for, if it could not be had, or once released.
   */
  load(): Promise<string | undefined>;
  release(): void;
}

export function createPlayback(config: {
  request: Request;
  urls: ObjectUrls;
  entryId: string;
}): Playback {
  const { request, urls, entryId } = config;

  let state: PlaybackState = { status: 'idle' };
  let released = false;
  const listeners = new Set<() => void>();

  function set(next: PlaybackState): void {
    state = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async load() {
      if (released || state.status === 'fetching') {
        return undefined;
      }

      if (state.status === 'ready') {
        return state.url;
      }

      set({ status: 'fetching' });

      const result = await request<Blob>(`/entries/${entryId}/audio`, {
        receive: 'blob',
      });

      /* The memo left the screen while its audio was on the way. */
      if (released) {
        return undefined;
      }

      if (result.kind === 'ok') {
        const url = urls.create(result.data);

        set({ status: 'ready', url });
        return url;
      }

      /* An ended session says nothing here: the screen leaves for /in. */
      set(
        result.kind === 'ended'
          ? { status: 'idle' }
          : {
              status: 'failed',
              why: result.kind === 'unreachable' ? 'unreachable' : 'refused',
            },
      );
      return undefined;
    },
    release() {
      released = true;

      if (state.status === 'ready') {
        urls.revoke(state.url);
      }

      state = { status: 'idle' };
    },
  };
}
