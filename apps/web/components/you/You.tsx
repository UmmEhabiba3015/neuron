'use client';

import type { User } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { Gate } from '@/components/layout/Gate';
import {
  JournalBox,
  LiveScreen,
  PushedScreen,
} from '@/components/layout/LiveScreen';
import { KeyBox } from '@/components/layout/Chrome';
import { NotBuiltInPlace } from '@/components/ui/NotBuilt';
import { Devices } from '@/components/you/Devices';
import { session } from '@/lib/api/client';
import type { SignOutScope } from '@/lib/api/session';
import { notSavedSentence, timezoneSaveOutcome } from '@/lib/timezone';
import { UNBUILT } from '@/lib/unbuilt';
import { timezoneLabelNow, timezoneChoicesNow } from '@/lib/utils/clock';
import { keepingSince } from '@/lib/your-data';

/*
 * The designer's sentence says 4am. A day ends at midnight
 * (docs/features.md, Ref 7), and an entry stays on its day (Ref 7, and
 * rule 11 under "Rules every feature keeps").
 */
const TIMEZONE_RULE =
  'A day ends at midnight in this timezone. Changing it does not move anything already written.';

/*
 * You, from 07-you.html: what is private, what is yours, and your account.
 * Every row leads to its page.
 *
 * The date box says since when the journal has been kept: the month the
 * account was created, in the person's timezone (docs/features.md, Ref 37).
 * The line at the foot says the same thing and is not drawn.
 *
 * Your data has no value here. Its counts are on Your data itself.
 */
export function You() {
  return <Gate>{(user) => <YouRows user={user} />}</Gate>;
}

function KeepingSince({ user }: { user: User }) {
  return (
    <KeyBox
      label="Keeping"
      value={keepingSince(user.createdAt, user.timezone)}
    />
  );
}

function YouRows({ user }: { user: User }) {
  return (
    <LiveScreen current="You" title="You" aside={<KeepingSince user={user} />}>
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
        <Link className="srowlink" href="/you/yourdata">
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
 * product rule, so each was checked against docs/features.md:
 *
 *   How long it is kept      Refs 10 and 8: a deleted entry is kept,
 *                            hidden, until the account is deleted, and
 *                            deleting the account removes everything
 *   Who else can read it     Ref 42 and rule 2 of "Rules every feature
 *                            keeps": no sharing, and another person's
 *                            journal is "not found"
 *
 * The other three are not decided, so the sentence stands in place of what
 * they say (lib/unbuilt.ts). What leaves and who processes it wait for the
 * AI provider, which is not yet decided ("Not yet decided"); the comp's
 * "only when you use a model feature" is not true of a reflection, which
 * appears without anyone asking (Ref 32). Training has no decision at all
 * (Ref 35).
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
 * work of Search (feature 10) and
 * "keep this out of memory" (docs/features.md, Ref 25).
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
 * email, the timezone, the signed-in devices, and signing out of this
 * device or of every device.
 *
 * Not drawn: the sentence about choosing a new password through the
 * forgot-password link.
 */
export function Account() {
  return <Gate>{(user) => <AccountRows user={user} />}</Gate>;
}

type Press =
  | { status: 'idle' }
  | { status: 'asking'; scope: SignOutScope }
  | {
      status: 'notSignedOut';
      scope: SignOutScope;
      why: 'unreachable' | 'failed';
    };

const SIGNING_OUT: Record<SignOutScope, string> = {
  thisDevice: 'Signing out.',
  everywhere: 'Signing out everywhere.',
};

const NOT_SIGNED_OUT: Record<
  SignOutScope,
  Record<'unreachable' | 'failed', string>
> = {
  thisDevice: {
    unreachable:
      'We could not reach the server. You are still signed in on this device. Try signing out again.',
    failed:
      'Something went wrong on our side. You are still signed in on this device. Try signing out again.',
  },
  everywhere: {
    unreachable:
      'We could not reach the server. You are still signed in on every device. Try signing out everywhere again.',
    failed:
      'Something went wrong on our side. You are still signed in on every device. Try signing out everywhere again.',
  },
};

function AccountRows({ user }: { user: User }) {
  const router = useRouter();
  const [press, setPress] = useState<Press>({ status: 'idle' });

  /*
   * Both buttons work the same way, and at once, with no question first
   * (her decision for signing out everywhere, as for this device).
   *
   * The buttons are never disabled. A second press while the first is out
   * sends nothing: the session shares the one request.
   *
   * On success nothing more is done here. The session says the person is
   * signed out, and Gate sends them to /in. The address is replaced there,
   * and also here, so that whichever runs first, Back does not return to
   * this page.
   */
  async function signOut(scope: SignOutScope) {
    setPress({ status: 'asking', scope });

    const outcome = await session.signOut(scope);

    if (outcome === 'signedOut') {
      router.replace('/in');
      return;
    }

    setPress({ status: 'notSignedOut', scope, why: outcome });
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
            <span className="val">
              {timezoneLabelNow(user.timezone)}
            </span>
          </Link>
          <Devices timeZone={user.timezone} />
          {press.status === 'notSignedOut' ? (
            <div className="notice" role="alert">
              {NOT_SIGNED_OUT[press.scope][press.why]}
            </div>
          ) : null}
          {press.status === 'asking' ? (
            <p className="auth-help" role="status">
              {SIGNING_OUT[press.scope]}
            </p>
          ) : null}
          <div className="auth-actions">
            <button
              className="btn quiet"
              type="button"
              onClick={() => void signOut('thisDevice')}
            >
              Sign out of this device
            </button>
            <button
              className="btn quiet"
              type="button"
              onClick={() => void signOut('everywhere')}
            >
              Sign out everywhere
            </button>
          </div>
        </div>
      </main>
    </LiveScreen>
  );
}

/*
 * Timezone, from #timezone-choose in 17-account-data.html. One list of every
 * zone the browser knows, with the person's own chosen. Saving returns to
 * Account, which shows the new one. What an answer means is decided in
 * lib/timezone.ts.
 *
 * Nothing already written moves (docs/features.md, Ref 7), which is what
 * the sentence at the top says.
 */
export function Timezone() {
  return <Gate>{(user) => <TimezoneRows user={user} />}</Gate>;
}

type TimezoneStep =
  | { status: 'choosing' }
  | { status: 'saving' }
  | { status: 'notSaved'; why: 'refused' | 'unreachable' | 'failed' };

function TimezoneRows({ user }: { user: User }) {
  const router = useRouter();
  const [choices] = useState(() =>
    timezoneChoicesNow(Intl.supportedValuesOf('timeZone'), user.timezone),
  );
  const [chosen, setChosen] = useState(
    () => choices.find((choice) => choice.chosen)?.value ?? user.timezone,
  );
  const [step, setStep] = useState<TimezoneStep>({ status: 'choosing' });
  const inFlight = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setStep({ status: 'saving' });

    const outcome = timezoneSaveOutcome(await session.setTimezone(chosen));

    inFlight.current = false;

    if (outcome === 'saved') {
      router.push('/you/account');
      return;
    }

    /* The session is over, and Gate sends the person to sign in. */
    if (outcome === 'ended') {
      return;
    }

    setStep({ status: 'notSaved', why: outcome });
  }

  return (
    <LiveScreen current="You" title="You" surface aside={<JournalBox />}>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">Timezone</h2>
          <p className="auth-copy">{TIMEZONE_RULE}</p>
          {step.status === 'notSaved' ? (
            <div className="notice" role="alert">
              {notSavedSentence(
                step.why,
                chosen,
                timezoneLabelNow(user.timezone),
              )}
            </div>
          ) : null}
          <form className="auth-form" onSubmit={save}>
            <div className="auth-field">
              <label htmlFor="timezone">Timezone</label>
              <select
                className="field"
                id="timezone"
                name="timezone"
                value={chosen}
                onChange={(event) => {
                  setChosen(event.target.value);
                  setStep({ status: 'choosing' });
                }}
              >
                {choices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
            {step.status === 'saving' ? (
              <p className="auth-help" role="status">
                Saving your timezone.
              </p>
            ) : null}
            <button className="btn solid" type="submit">
              Save timezone
            </button>
          </form>
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
