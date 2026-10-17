'use client';

import type { User } from '@neuron/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { CouldNotConnect } from '@/components/layout/CouldNotConnect';
import { BlankScreen } from './AuthScreen';
import { useSession } from '@/hooks/useSession';
import { SIGN_IN_AFTER_DELETE } from '@/lib/your-data';

/*
 * What stands in front of every screen of the journal. Its children are
 * drawn only for a person who is signed in, and are handed that person.
 *
 * A person who is signed out leaves for /in. That is also what keeps Back
 * from showing the journal after a sign-out: the page that Back returns to
 * is drawn by this component first, and it draws nothing.
 *
 * A person who has just deleted their account leaves for the address where
 * sign in says so (ADR-024).
 */
export function Gate({ children }: { children: (user: User) => ReactNode }) {
  const state = useSession();
  const router = useRouter();
  const signedOut = state.status === 'signedOut';
  const deleted = state.status === 'signedOut' && state.deleted === true;

  useEffect(() => {
    if (signedOut) {
      router.replace(deleted ? SIGN_IN_AFTER_DELETE : '/in');
    }
  }, [signedOut, deleted, router]);

  if (state.status === 'unreachable') {
    return <CouldNotConnect asking={state.asking} asked={state.asked} />;
  }

  if (state.status !== 'signedIn') {
    return <BlankScreen />;
  }

  return children(state.user);
}
