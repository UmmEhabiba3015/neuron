'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { session } from '@/lib/api';
import type { SessionState } from '@/lib/session';

/*
 * What the server renders, and what the browser renders first. The server
 * never has the access token (ADR-018), so it cannot know who is signed in
 * and always says so.
 */
const NOT_YET_KNOWN: SessionState = { status: 'unknown' };

/*
 * The session, for a screen. Every screen that uses this asks for the
 * on-load refresh when it mounts. React in development mounts twice, and the
 * session module shares that refresh, so one request is sent.
 */
export function useSession(): SessionState {
  const state = useSyncExternalStore(
    session.subscribe,
    session.getState,
    () => NOT_YET_KNOWN,
  );

  useEffect(() => {
    void session.restore();
  }, []);

  return state;
}
