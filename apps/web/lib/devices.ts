/*
 * The devices on Account: every place the person is signed in, and signing
 * out of one of them (docs/features.md, Ref 6).
 *
 * Like timeline.ts, this file is tested with Node alone, and the component
 * draws what `getState()` says.
 *
 * Signing out a device waits for the API (ADR-021): the row leaves the list
 * when the API confirms, and not before. Her decision: there is no question
 * first. The device signing out is said in its row while it is asked.
 */

import type { Session } from '@neuron/contracts';
import type { Request } from './today.ts';
import { formatDateIn } from './utils/format.ts';

export type DevicesView =
  | { status: 'opening' }
  | { status: 'open'; devices: readonly Session[] }
  | { status: 'unreachable'; asked: number }
  | { status: 'failed'; asked: number };

/*
 * What became of the last press of a device's Sign out, if it did not
 * succeed. The device is still signed in, and the sentence is said in its
 * row.
 */
export interface NotSignedOut {
  id: string;
  why: 'unreachable' | 'failed';
}

export interface DevicesState {
  view: DevicesView;
  /* The list is being asked for. */
  asking: boolean;
  /* The devices whose Sign out is in flight. */
  signingOut: readonly string[];
  notSignedOut: NotSignedOut | undefined;
}

export interface Devices {
  getState(): DevicesState;
  subscribe(listener: () => void): () => void;
  /* Asks for the list. A press while it is asking sends nothing. */
  open(): Promise<void>;
  /* Signs out one device. A press while its sign-out is out sends nothing. */
  signOut(id: string): Promise<void>;
}

export function createDevices(config: { request: Request }): Devices {
  const { request } = config;

  let state: DevicesState = {
    view: { status: 'opening' },
    asking: false,
    signingOut: [],
    notSignedOut: undefined,
  };
  let asked = 0;

  const listeners = new Set<() => void>();

  function set(next: Partial<DevicesState>): void {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  }

  async function open(): Promise<void> {
    if (state.asking) {
      return;
    }

    set({ asking: true });

    const answer = await request<Session[]>('/auth/sessions');

    if (answer.kind === 'ok') {
      asked = 0;
      set({ asking: false, view: { status: 'open', devices: answer.data } });
      return;
    }

    /* The session is over: the screen leaves for sign in, and says nothing. */
    if (answer.kind === 'ended') {
      set({ asking: false });
      return;
    }

    asked += 1;
    set({
      asking: false,
      view: {
        status: answer.kind === 'unreachable' ? 'unreachable' : 'failed',
        asked,
      },
    });
  }

  /*
   * A 404 means the device is not signed in, whether it was signed out
   * somewhere else in the meantime or has expired, so it leaves the list
   * as a success does.
   */
  async function signOut(id: string): Promise<void> {
    if (state.signingOut.includes(id)) {
      return;
    }

    set({
      signingOut: [...state.signingOut, id],
      notSignedOut:
        state.notSignedOut?.id === id ? undefined : state.notSignedOut,
    });

    const answer = await request<void>(`/auth/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const signingOut = state.signingOut.filter((each) => each !== id);
    const gone =
      answer.kind === 'ok' ||
      (answer.kind === 'rejected' && answer.status === 404);

    if (gone) {
      set({
        signingOut,
        view:
          state.view.status === 'open'
            ? {
                status: 'open',
                devices: state.view.devices.filter((each) => each.id !== id),
              }
            : state.view,
      });
      return;
    }

    if (answer.kind === 'ended') {
      set({ signingOut });
      return;
    }

    set({
      signingOut,
      notSignedOut: {
        id,
        why: answer.kind === 'unreachable' ? 'unreachable' : 'failed',
      },
    });
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open,
    signOut,
  };
}

/*
 * The line under a device's name. Her words (docs/features.md, Ref 6;
 * decided 2026-10-15). The dates are in the person's
 * timezone, as everywhere else. This device is in use as it is read, so it
 * was last used now.
 */
export function deviceLine(device: Session, timeZone: string): string {
  const signedIn = `Signed in ${formatDateIn(device.createdAt, timeZone)}.`;

  if (device.current) {
    return `This device. Last used now. ${signedIn}`;
  }

  return `Last used ${formatDateIn(device.lastUsedAt, timeZone)}. ${signedIn}`;
}

/* What a device's row says when its Sign out did not go through. */
export const DEVICE_NOT_SIGNED_OUT: Record<NotSignedOut['why'], string> = {
  unreachable:
    'We could not reach the server. That device is still signed in. Try its Sign out again.',
  failed:
    'Something went wrong on our side. That device is still signed in. Try its Sign out again.',
};
