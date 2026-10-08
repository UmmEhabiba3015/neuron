'use client';

import type { WireUser } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Gate } from '@/app/components/Gate';
import { JournalBox, LiveScreen } from '@/app/components/LiveScreen';
import { session } from '@/lib/api';

/*
 * You, from 07-you.html, with the one row that leads somewhere. The other
 * three rows, the "Keeping since" box and the line at the foot are not
 * drawn: each is about something that is not built.
 */
export function You() {
  return <Gate>{(user) => <YouRows user={user} />}</Gate>;
}

function YouRows({ user }: { user: WireUser }) {
  return (
    <LiveScreen current="You" title="You" aside={<JournalBox />}>
      <main className="sheet">
        <h2 className="shead">Your account</h2>
        <Link className="srowlink" href="/you/account">
          <span className="lab">
            Account
            <span className="why">Your name, your email, and sign out.</span>
          </span>
          <span className="val">{user.email}</span>
        </Link>
      </main>
    </LiveScreen>
  );
}

/*
 * Account, from the Account state of 17-account-data.html. Not drawn: the
 * timezone row, the list of devices, "Sign out everywhere", and the sentence
 * about choosing a new password.
 */
export function Account() {
  return <Gate>{(user) => <AccountRows user={user} />}</Gate>;
}

type Press =
  | { status: 'idle' }
  | { status: 'asking' }
  | { status: 'notSignedOut'; why: 'unreachable' | 'failed' };

const NOT_SIGNED_OUT = {
  unreachable:
    'We could not reach the server. You are still signed in on this device. Try signing out again.',
  failed:
    'Something went wrong on our side. You are still signed in on this device. Try signing out again.',
};

function AccountRows({ user }: { user: WireUser }) {
  const router = useRouter();
  const [press, setPress] = useState<Press>({ status: 'idle' });

  /*
   * The button is never disabled. A second press while the first is out
   * sends nothing: the session shares the one request.
   *
   * On success nothing more is done here. The session says the person is
   * signed out, and Gate sends them to /in. The address is replaced there,
   * and also here, so that whichever runs first, Back does not return to
   * this page.
   */
  async function signOut() {
    setPress({ status: 'asking' });

    const outcome = await session.signOut();

    if (outcome === 'signedOut') {
      router.replace('/in');
      return;
    }

    setPress({ status: 'notSignedOut', why: outcome });
  }

  return (
    <LiveScreen current="You" title="You" surface aside={<JournalBox />}>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">Account</h2>
          <div className="srowlink">
            <span className="lab">
              Name
              <span className="why">What you are called here.</span>
            </span>
            <span className="val">{user.name}</span>
          </div>
          <div className="srowlink">
            <span className="lab">
              Email
              <span className="why">The address used to sign in.</span>
            </span>
            <span className="val">{user.email}</span>
          </div>
          {press.status === 'notSignedOut' ? (
            <div className="notice" role="alert">
              {NOT_SIGNED_OUT[press.why]}
            </div>
          ) : null}
          {press.status === 'asking' ? (
            <p className="auth-help" role="status">
              Signing out.
            </p>
          ) : null}
          <div className="auth-actions">
            <button
              className="btn quiet"
              type="button"
              onClick={() => void signOut()}
            >
              Sign out of this device
            </button>
          </div>
        </div>
      </main>
    </LiveScreen>
  );
}
