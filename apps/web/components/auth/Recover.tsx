'use client';

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_LIFETIME_MINUTES,
} from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AuthScreen, BlankScreen } from '@/components/layout/AuthScreen';
import { useSession } from '@/hooks/useSession';
import { CouldNotConnect } from '@/components/layout/CouldNotConnect';
import { session } from '@/lib/api/client';
import {
  SIGN_IN_AFTER_RESET,
  forgotOutcome,
  readForgotForm,
  readResetForm,
  resetOutcome,
  type NewPasswordProblems,
  type ResetOutcome,
} from '@/lib/recover';
import {
  COULD_NOT_REACH,
  NO_EMAIL,
  PasswordField,
  SENTENCES,
  SOMETHING_WENT_WRONG,
  inProductWords,
} from './AuthForm';

/*
 * The two screens of a forgotten password, from #auth-forgot and #auth-reset
 * in 15-auth-states.html. What each answer means is decided in
 * lib/recover.ts; these draw it.
 *
 * Like sign in, they are for a person who is signed out. A person who is
 * signed in is sent to Today.
 */
function SignedOutOnly({ children }: { children: ReactNode }) {
  const state = useSession();
  const router = useRouter();
  const signedIn = state.status === 'signedIn';

  useEffect(() => {
    if (signedIn) {
      router.replace('/');
    }
  }, [signedIn, router]);

  if (state.status === 'unreachable') {
    return <CouldNotConnect asking={state.asking} asked={state.asked} />;
  }

  if (state.status !== 'signedOut') {
    return <BlankScreen />;
  }

  return <AuthScreen>{children}</AuthScreen>;
}

/* Her words (docs/workers/feature-2-forgot-password.md). */
const LINK_SENT = `If an account uses that email, we have sent it a link to choose a new password. The link works for ${PASSWORD_RESET_LIFETIME_MINUTES} minutes.`;
const BAD_LINK = 'This link has expired or has already been used.';
const ASK_AGAIN = 'Ask for a new one.';

type ForgotStep = 'typing' | 'sending' | 'sent' | 'unreachable';

/* /forgot. Reached from "Forgot your password?" on sign in. */
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<ForgotStep>('typing');
  const [notAnEmail, setNotAnEmail] = useState(false);
  const inFlight = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    const reading = readForgotForm(email);

    if (!reading.send) {
      setNotAnEmail(true);
      document.getElementById('email')?.focus();
      return;
    }

    inFlight.current = true;
    setStep('sending');

    const outcome = forgotOutcome(await session.forgotPassword(reading.email));

    inFlight.current = false;
    setStep(outcome);
  }

  return (
    <SignedOutOnly>
      <h2 className="auth-heading" id="auth-heading">
        Reset your password
      </h2>

      {step === 'sending' ? (
        <p className="auth-copy" role="status">
          Sending the link.
        </p>
      ) : step === 'sent' ? (
        <div className="notice" role="status">
          {LINK_SENT}
        </div>
      ) : step === 'unreachable' ? (
        <div className="notice" role="alert">
          {COULD_NOT_REACH}
        </div>
      ) : (
        <p className="auth-copy">
          Enter your email address. We will send a link you can use to choose a
          new password.
        </p>
      )}

      {step === 'sent' ? null : (
        <form className="auth-form" noValidate onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="field-inner">
              <input
                className="field"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setNotAnEmail(false);
                }}
                aria-invalid={notAnEmail ? true : undefined}
                aria-describedby={notAnEmail ? 'email-help' : undefined}
              />
              {notAnEmail ? (
                <p className="auth-help" id="email-help">
                  {NO_EMAIL}
                </p>
              ) : null}
            </div>
          </div>
          <button className="btn solid" type="submit">
            {step === 'unreachable' ? 'Try again' : 'Send reset link'}
          </button>
        </form>
      )}

      <div className="auth-actions">
        <Link className="btn quiet" href="/in">
          Back to sign in
        </Link>
      </div>
    </SignedOutOnly>
  );
}

type ResetStep = { kind: 'typing' } | { kind: 'sending' } | ResetOutcome;

/*
 * /reset?token=... In the product it is reached by the link in the email.
 * Without a token there is nothing to try, and it says what it says of a
 * link that does not work.
 */
export function ChooseNewPassword({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [problems, setProblems] = useState<NewPasswordProblems>({});
  /* A sentence from the API about the password, in this product's words. */
  const [passwordSentence, setPasswordSentence] = useState<string | null>(
    null,
  );

  const [step, setStep] = useState<ResetStep>(
    token === null ? { kind: 'badLink' } : { kind: 'typing' },
  );
  const inFlight = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current || token === null) {
      return;
    }

    const reading = readResetForm(password, confirmation, PASSWORD_MIN_LENGTH);

    if (!reading.send) {
      setProblems(reading.problems);
      document.getElementById(reading.first)?.focus();
      return;
    }

    inFlight.current = true;
    setStep({ kind: 'sending' });

    const outcome = resetOutcome(
      await session.resetPassword(token, reading.password),
    );

    inFlight.current = false;

    /*
     * replace and not push: Back from sign in must not return to a form
     * whose link has just been used.
     */
    if (outcome.kind === 'changed') {
      router.replace(SIGN_IN_AFTER_RESET);
      return;
    }

    if (outcome.kind === 'password') {
      setProblems({});
      setStep({ kind: 'typing' });
      setPasswordSentence(inProductWords(outcome.message));
      return;
    }

    setStep(outcome);
  }

  const sentenceFor = {
    password: problems.password
      ? SENTENCES[problems.password]
      : (passwordSentence ?? undefined),
    confirmation: problems.confirmation
      ? SENTENCES[problems.confirmation]
      : undefined,
  };

  if (step.kind === 'badLink') {
    return (
      <SignedOutOnly>
        <h2 className="auth-heading" id="auth-heading">
          Choose a new password
        </h2>
        <div className="notice" role="alert">
          {BAD_LINK}{' '}
          <Link href="/forgot">{ASK_AGAIN}</Link>
        </div>
        <div className="auth-actions">
          <Link className="btn quiet" href="/in">
            Back to sign in
          </Link>
        </div>
      </SignedOutOnly>
    );
  }

  const notice =
    step.kind === 'unreachable'
      ? COULD_NOT_REACH
      : step.kind === 'failed'
        ? SOMETHING_WENT_WRONG
        : null;

  return (
    <SignedOutOnly>
      <h2 className="auth-heading" id="auth-heading">
        Choose a new password
      </h2>

      {step.kind === 'sending' || step.kind === 'changed' ? (
        <p className="auth-copy" role="status">
          Saving your new password.
        </p>
      ) : notice ? (
        <div className="notice" role="alert">
          {notice}
        </div>
      ) : (
        <p className="auth-copy">
          Use at least {PASSWORD_MIN_LENGTH} characters.
        </p>
      )}

      <form className="auth-form" noValidate onSubmit={submit}>
        <PasswordField
          id="password"
          label="New password"
          what="new password"
          autoComplete="new-password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            setProblems({});
            setPasswordSentence(null);
          }}
          problem={sentenceFor.password}
        />
        <PasswordField
          id="confirmation"
          label="Confirm password"
          what="confirmed password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(value) => {
            setConfirmation(value);
            setProblems({ ...problems, confirmation: undefined });
          }}
          problem={sentenceFor.confirmation}
        />
        <button className="btn solid" type="submit">
          {step.kind === 'unreachable' ? 'Try again' : 'Save new password'}
        </button>
      </form>
    </SignedOutOnly>
  );
}
