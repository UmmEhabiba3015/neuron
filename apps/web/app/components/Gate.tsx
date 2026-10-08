'use client';

import type { WireUser } from '@neuron/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { CouldNotConnect } from '@/app/screens/CouldNotConnect';
import { BlankScreen } from './AuthScreen';
import { useSession } from './useSession';

/*
 * What stands in front of every screen of the journal. Its children are
 * drawn only for a person who is signed in, and are handed that person.
 *
 * A person who is signed out leaves for /in. That is also what keeps Back
 * from showing the journal after a sign-out: the page that Back returns to
 * is drawn by this component first, and it draws nothing.
 */
export function Gate({ children }: { children: (user: WireUser) => ReactNode }) {
  const state = useSession();
  const router = useRouter();
  const signedOut = state.status === 'signedOut';

  useEffect(() => {
    if (signedOut) {
      router.replace('/in');
    }
  }, [signedOut, router]);

  if (state.status === 'unreachable') {
    return <CouldNotConnect asking={state.asking} asked={state.asked} />;
  }

  if (state.status !== 'signedIn') {
    return <BlankScreen />;
  }

  return children(state.user);
}
