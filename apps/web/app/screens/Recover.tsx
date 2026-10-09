'use client';

import { PASSWORD_MIN_LENGTH } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AuthScreen, BlankScreen } from '@/app/components/AuthScreen';
import { NotBuiltYet, useNotBuilt } from '@/app/components/NotBuilt';
import { useSession } from '@/app/components/useSession';
import { CouldNotConnect } from './CouldNotConnect';
import { PasswordField } from './AuthForm';

/*
 * The two screens of a forgotten password, from #auth-forgot and #auth-reset
 * in 15-auth-states.html. Only their main state is drawn. Sending the link
 * and saving the new password are Day 20's (lib/unbuilt.ts): a press says
 * so, and nothing is sent.
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

/* /forgot. Reached from "Forgot your password?" on sign in. */
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const send = useNotBuilt('sendResetLink');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send.press();
  }

  return (
    <SignedOutOnly>
      <h2 className="auth-heading" id="auth-heading">
        Reset your password
      </h2>
      <p className="auth-copy">
        Enter your email address. We will send a link you can use to choose a
        new password.
      </p>

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
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>
        <button className="btn solid" type="submit" {...send.marker}>
          {send.label}
        </button>
        {send.said ? <NotBuiltYet className="auth-help" /> : null}
      </form>

      <div className="auth-actions">
        <Link className="btn quiet" href="/in">
          Back to sign in
        </Link>
      </div>
    </SignedOutOnly>
  );
}

/* /reset. In the product it is reached by the link in the email. */
export function ChooseNewPassword() {
  const [password, setPassword] = useState('');
  const save = useNotBuilt('saveNewPassword');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.press();
  }

  return (
    <SignedOutOnly>
      <h2 className="auth-heading" id="auth-heading">
        Choose a new password
      </h2>
      <p className="auth-copy">
        Use at least {PASSWORD_MIN_LENGTH} characters.
      </p>

      <form className="auth-form" noValidate onSubmit={submit}>
        <PasswordField
          id="password"
          label="New password"
          what="new password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <button className="btn solid" type="submit" {...save.marker}>
          {save.label}
        </button>
        {save.said ? <NotBuiltYet className="auth-help" /> : null}
      </form>
    </SignedOutOnly>
  );
}
