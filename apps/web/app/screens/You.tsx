'use client';

import type { WireUser } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Gate } from '@/app/components/Gate';
import {
  JournalBox,
  LiveScreen,
  PushedScreen,
} from '@/app/components/LiveScreen';
import {
  NotBuiltInPlace,
  NotBuiltRow,
  NotBuiltYet,
  useNotBuilt,
} from '@/app/components/NotBuilt';
import { session } from '@/lib/api';
import { NOT_BUILT_YET, UNBUILT } from '@/lib/unbuilt';

/*
 * The designer's sentence says 4am. A day ends at midnight
 * (docs/requirements.md 3.2), and an entry stays on its day (3.2.3).
 */
const TIMEZONE_RULE =
  'A day ends at midnight in this timezone. Changing it does not move anything already written.';

/*
 * You, from 07-you.html: what is private, what is yours, and your account.
 * Every row leads to its page.
 *
 * The date box says since when the journal has been kept. The month an
 * account was made depends on its timezone, and WireUser does not carry the
 * timezone until Day 34, so the sentence stands in the box
 * (lib/unbuilt.ts). The line at the foot says the same thing and is not
 * drawn.
 *
 * Your data has no value. The comp's "148 and 31" is a count of entries and
 * recordings, and nothing counts them yet.
 */
export function You() {
  return <Gate>{(user) => <YouRows user={user} />}</Gate>;
}

function KeepingSince() {
  return (
    <div className="keybox">
      <span className="k">{UNBUILT.keepingSince.label}</span>
      <span className="v printed" data-unbuilt="keepingSince">
        {NOT_BUILT_YET}
      </span>
    </div>
  );
}

function YouRows({ user }: { user: WireUser }) {
  return (
    <LiveScreen current="You" title="You" aside={<KeepingSince />}>
      <main className="sheet">
        <h2 className="shead">What is private</h2>
        <Link className="srowlink" href="/you/visible">
          <span className="lab">
            What the model can see
            <span className="why">
              The entries, transcripts and moods it may read, and what stays
              out of memory.
            </span>
          </span>
          <span className="val">Review</span>
        </Link>
        <Link className="srowlink" href="/you/privacy">
          <span className="lab">
            Privacy
            <span className="why">
              What is sent, who processes it, and how long it is kept.
            </span>
          </span>
          <span className="val">Read it</span>
        </Link>
        <h2 className="shead">What is yours</h2>
        <Link className="srowlink" href="/you/data">
          <span className="lab">
            Your data
            <span className="why">
              Export your journal, or delete the account and everything in it.
            </span>
          </span>
        </Link>
        <h2 className="shead">Your account</h2>
        <Link className="srowlink" href="/you/account">
          <span className="lab">
            Account
            <span className="why">
              Your name, your email, your timezone, signed-in devices, and
              sign out.
            </span>
          </span>
          <span className="val">{user.email}</span>
        </Link>
      </main>
    </LiveScreen>
  );
}

/*
 * Privacy, from #settings-privacy in 10-settings-privacy.html. Each row is a
 * product rule, so each was checked against docs/requirements.md:
 *
 *   How long it is kept      3.3.3 and 3.1.10: a deleted entry is kept,
 *                            hidden, until the account is deleted, and
 *                            deleting the account removes everything
 *   Who else can read it     2 and 4.2: no sharing, and another person's
 *                            journal is "not found"
 *
 * The other three are not decided, so the sentence stands in place of what
 * they say (lib/unbuilt.ts). What leaves and who processes it wait for the
 * AI provider, chosen in Phase 4 (6.6); the comp's "only when you use a
 * model feature" is not true of the weekly reflection, which runs on a
 * schedule (3.8.1). Training has no decision at all.
 *
 * The date at the foot, when this page last changed, is not drawn.
 */
export function Privacy() {
  return <Gate>{() => <PrivacyRows />}</Gate>;
}

function PrivacyRows() {
  return (
    <PushedScreen back={{ href: '/you', label: 'You' }} title="Privacy">
      <main className="sheet">
        <UndecidedRow name="whatLeaves" />
        <UndecidedRow name="whoProcesses" />
        <UndecidedRow name="training" />
        <div className="srowlink">
          <span className="lab">
            How long it is kept
            <span className="why">
              A deleted item leaves the product at once and stays hidden in
              storage until you delete your account. Deleting your account
              removes everything permanently.
            </span>
          </span>
        </div>
        <div className="srowlink">
          <span className="lab">
            Who else can read it
            <span className="why">
              Nobody. There is no sharing anywhere in this product and no link
              that works for anyone but you.
            </span>
          </span>
        </div>
        <Link className="srowlink" href="/support">
          <span className="lab">
            Support resource
            <span className="why">
              If you want to talk to someone, this is always available.
            </span>
          </span>
          <span className="val">Read</span>
        </Link>
      </main>
    </PushedScreen>
  );
}

function UndecidedRow({
  name,
}: {
  name: 'whatLeaves' | 'whoProcesses' | 'training';
}) {
  return (
    <div className="srowlink">
      <span className="lab">
        {UNBUILT[name].label}
        <NotBuiltInPlace name={name} className="why" span />
      </span>
    </div>
  );
}

/*
 * What it sees, from #settings-visible in 10-settings-privacy.html. No model
 * reads anything yet, and what one may read is decided with the retrieval
 * work of Day 22 and "keep this out of memory" (docs/requirements.md 3.7.4).
 * So each part has its heading and the sentence; the comp's rows are counts
 * of entries, recordings and moods, and its note at the foot is a rule that
 * is not decided.
 */
export function WhatItSees() {
  return <Gate>{() => <WhatItSeesRows />}</Gate>;
}

function WhatItSeesRows() {
  return (
    <PushedScreen back={{ href: '/you', label: 'You' }} title="What it sees">
      <main className="sheet">
        <h2 className="shead">{UNBUILT.modelCanRead.label}</h2>
        <div className="srow">
          <div className="ccol">
            <NotBuiltInPlace name="modelCanRead" className="lede" />
          </div>
        </div>
        <h2 className="shead">{UNBUILT.modelCannotRead.label}</h2>
        <div className="srow">
          <div className="ccol">
            <NotBuiltInPlace name="modelCannotRead" className="lede" />
          </div>
        </div>
      </main>
    </PushedScreen>
  );
}

/*
 * Account, from #account-devices in 17-account-data.html. The name, the
 * email and "Sign out of this device" work. The timezone row leads to its
 * screen. The devices and "Sign out everywhere" are Day 34's
 * (lib/unbuilt.ts): the devices section has its heading and the sentence in
 * place of rows, and a press of "Sign out everywhere" says so.
 *
 * The timezone row has no value: WireUser does not carry the timezone.
 *
 * Not drawn: the sentence about choosing a new password through the
 * forgot-password link, which is Day 20's.
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
  const everywhere = useNotBuilt('signOutEverywhere');

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
          <Link className="srowlink" href="/you/account/timezone">
            <span className="lab">
              Timezone
              <span className="why">{TIMEZONE_RULE}</span>
            </span>
          </Link>
          <h3 className="shead">{UNBUILT.signedInDevices.label}</h3>
          <NotBuiltInPlace name="signedInDevices" className="auth-copy" />
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
          {everywhere.said ? <NotBuiltYet className="auth-help" /> : null}
          <div className="auth-actions">
            <button
              className="btn quiet"
              type="button"
              onClick={() => void signOut()}
            >
              Sign out of this device
            </button>
            <button
              className="btn quiet"
              type="button"
              onClick={everywhere.press}
              {...everywhere.marker}
            >
              {everywhere.label}
            </button>
          </div>
        </div>
      </main>
    </LiveScreen>
  );
}

/*
 * Timezone, from #timezone-choose in 17-account-data.html. Choosing one is
 * Day 34's (lib/unbuilt.ts): the list and "Save timezone" are not drawn, and
 * the sentence stands in their place. The current timezone is not shown,
 * because WireUser does not carry it.
 */
export function Timezone() {
  return <Gate>{() => <TimezoneRows />}</Gate>;
}

function TimezoneRows() {
  return (
    <LiveScreen current="You" title="You" surface aside={<JournalBox />}>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">Timezone</h2>
          <p className="auth-copy">{TIMEZONE_RULE}</p>
          <NotBuiltInPlace name="chooseTimezone" className="auth-copy" />
          <div className="auth-actions">
            <Link className="btn quiet" href="/you/account">
              Leave as it is
            </Link>
          </div>
        </div>
      </main>
    </LiveScreen>
  );
}

/*
 * Your data, from #settings-data in 00-prototype.html. Export and deleting
 * the account are Day 34's (lib/unbuilt.ts): each row says so when pressed.
 * The confirmation dialog for deleting is not reachable and not built.
 *
 * Export is one row, as the comp and docs/ui-handover.md 8 have it: one
 * file holding the Markdown, the JSON and the audio files. Its value, a
 * count, is not drawn, because nothing counts yet.
 */
export function YourData() {
  return <Gate>{() => <YourDataRows />}</Gate>;
}

function YourDataRows() {
  return (
    <PushedScreen back={{ href: '/you', label: 'You' }} title="Your data">
      <main className="sheet">
        <h2 className="shead">Take it out</h2>
        <NotBuiltRow
          name="exportEverything"
          why="Your journal as Markdown and as JSON, and your recordings as audio files, in one download."
        />
        <h2 className="shead">End it</h2>
        <NotBuiltRow
          name="deleteAccount"
          why="Delete this account and everything in it. Export is directly above this for a reason."
          value="Permanent"
        />
      </main>
    </PushedScreen>
  );
}
