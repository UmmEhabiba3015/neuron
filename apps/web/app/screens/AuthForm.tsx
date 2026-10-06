'use client';

import { PASSWORD_MIN_LENGTH } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthScreen, BlankScreen } from '@/app/components/AuthScreen';
import { useSession } from '@/app/components/useSession';
import { session } from '@/lib/api';
import type { ApiResult } from '@/lib/session';
import { CouldNotConnect } from './CouldNotConnect';

type Mode = 'in' | 'new';

type FieldName = 'email' | 'password';
type FieldSentences = Partial<Record<FieldName, string>>;

/*
 * What the last attempt came to. Each one is a different thing to say, and
 * `unreachable` and `refused` in particular are never merged: no answer from
 * the server and a refusal by it are different facts.
 */
type Outcome =
  | { kind: 'none' }
  | { kind: 'fields'; sentences: FieldSentences; other: string[] }
  | { kind: 'refused' }
  | { kind: 'taken' }
  | { kind: 'unreachable' }
  | { kind: 'failed' };

const TOO_SHORT = `That is shorter than ${PASSWORD_MIN_LENGTH} characters.`;

const WORDS = {
  in: {
    heading: 'Log in',
    copy: 'Open your journal on this device.',
    submit: 'Log in',
    sending: 'Logging in.',
    passwordAutoComplete: 'current-password',
  },
  new: {
    heading: 'Create an account',
    copy: 'Keep what you have written.',
    submit: 'Create account',
    sending: 'Creating your account.',
    passwordAutoComplete: 'new-password',
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const state = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'none' });
  const [sending, setSending] = useState(false);

  /* A second press while a request is in flight must not send a second one. */
  const inFlight = useRef(false);

  const signedIn = state.status === 'signedIn';

  /*
   * replace and not push: Back from Today must not return to the form
   * (docs/ui-handover.md 3.3).
   */
  useEffect(() => {
    if (signedIn) {
      router.replace('/');
    }
  }, [signedIn, router]);

  if (state.status === 'unreachable') {
    return <CouldNotConnect />;
  }

  if (state.status !== 'signedOut') {
    return <BlankScreen />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    const address = email.trim();
    const sentences = checkFields(mode, address, password);

    if (sentences.email || sentences.password) {
      setOutcome({ kind: 'fields', sentences, other: [] });
      return;
    }

    inFlight.current = true;
    setSending(true);

    const next =
      mode === 'in'
        ? outcomeOf(await session.login(address, password), 'login')
        : await createAccount(address, password);

    inFlight.current = false;
    setSending(false);
    setOutcome(next);
  }

  const words = WORDS[mode];
  const ended = mode === 'in' && state.ended && outcome.kind === 'none';
  const sentences = outcome.kind === 'fields' ? outcome.sentences : {};

  const heading =
    outcome.kind === 'unreachable'
      ? 'Could not connect'
      : outcome.kind === 'refused'
        ? 'Try again'
        : ended
          ? 'Log in again'
          : words.heading;

  const copy =
    outcome.kind === 'unreachable'
      ? 'We could not finish that request.'
      : ended
        ? 'Your session has ended. Log in to open your account.'
        : words.copy;

  const notice =
    outcome.kind === 'refused'
      ? ['We could not log you in with those details.']
      : outcome.kind === 'taken'
        ? ['There is already an account with this email.']
        : outcome.kind === 'failed'
          ? ['Something went wrong on our side. Nothing was changed.']
          : outcome.kind === 'fields'
            ? outcome.other
            : [];

  const emailHelp =
    sentences.email ??
    (outcome.kind === 'taken'
      ? 'Use another email, or log in to your existing journal.'
      : undefined);

  const passwordHelp =
    sentences.password ??
    (outcome.kind === 'refused'
      ? 'Check your email and password, then try again.'
      : mode === 'new'
        ? `Use at least ${PASSWORD_MIN_LENGTH} characters. A few unrelated words work well.`
        : undefined);

  return (
    <AuthScreen>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">{heading}</h2>
          <p className="auth-copy">{copy}</p>

          {notice.map((sentence) => (
            <div className="notice" role="alert" key={sentence}>
              {sentence}
            </div>
          ))}

          {/* noValidate: the browser's own bubbles would replace the
              sentence that belongs beside the field. */}
          <form className="auth-form" noValidate onSubmit={submit}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                className="field"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={sentences.email ? true : undefined}
                aria-describedby={emailHelp ? 'email-help' : undefined}
              />
              {emailHelp ? (
                <p className="auth-help" id="email-help">
                  {emailHelp}
                </p>
              ) : null}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                className="field"
                id="password"
                name="password"
                type="password"
                autoComplete={words.passwordAutoComplete}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={sentences.password ? true : undefined}
                aria-describedby={passwordHelp ? 'password-help' : undefined}
              />
              {passwordHelp ? (
                <p className="auth-help" id="password-help">
                  {passwordHelp}
                </p>
              ) : null}
            </div>

            {sending ? (
              <p className="auth-help" role="status">
                {words.sending}
              </p>
            ) : null}

            <div className="auth-actions">
              <button className="btn solid" type="submit">
                {words.submit}
              </button>
              {mode === 'in' ? (
                <Link className="btn quiet" href="/new">
                  Create an account
                </Link>
              ) : (
                <Link className="btn quiet" href="/in">
                  {outcome.kind === 'taken'
                    ? 'Log in instead'
                    : 'Already have an account? Log in'}
                </Link>
              )}
            </div>
          </form>
        </div>
      </main>
    </AuthScreen>
  );
}

/*
 * The register endpoint does not sign the user in, and a new account is
 * signed in at once (docs/ui-handover.md 3.2), so this registers and then
 * logs in.
 */
async function createAccount(
  email: string,
  password: string,
): Promise<Outcome> {
  const registered = outcomeOf(
    await session.register(email, password),
    'register',
  );

  if (registered.kind !== 'none') {
    return registered;
  }

  return outcomeOf(await session.login(email, password), 'login');
}

function outcomeOf(
  result: ApiResult<unknown>,
  request: 'login' | 'register',
): Outcome {
  if (result.kind === 'ok') {
    return { kind: 'none' };
  }

  if (result.kind === 'unreachable') {
    return { kind: 'unreachable' };
  }

  if (result.kind === 'rejected') {
    if (result.status === 401 && request === 'login') {
      return { kind: 'refused' };
    }

    if (result.status === 409 && request === 'register') {
      return { kind: 'taken' };
    }

    if (result.status === 400) {
      return fromApiMessages(result.messages);
    }
  }

  return { kind: 'failed' };
}

/* Checked in the browser first, so an obvious slip costs no request. */
function checkFields(
  mode: Mode,
  email: string,
  password: string,
): FieldSentences {
  const sentences: FieldSentences = {};

  if (email === '') {
    sentences.email = 'Enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
    sentences.email = 'That does not look like an email address.';
  }

  if (mode === 'in' && password === '') {
    sentences.password = 'Enter your password.';
  } else if (mode === 'new' && password.length < PASSWORD_MIN_LENGTH) {
    sentences.password = TOO_SHORT;
  }

  return sentences;
}

/*
 * The API refused the input and sent an array of messages. Each one begins
 * with the name of the field it is about, which is how it finds its place.
 *
 * The API's sentences are written for developers. The two it sends in
 * practice are replaced with this product's own wording; any other is shown
 * as it came, because a sentence in the wrong register is better than no
 * sentence.
 */
function fromApiMessages(messages: string[]): Outcome {
  const sentences: FieldSentences = {};
  const other: string[] = [];

  for (const message of messages) {
    const field = (['email', 'password'] as const).find((name) =>
      message.startsWith(`${name} `),
    );

    if (!field) {
      other.push(asSentence(message));
    } else if (!sentences[field]) {
      sentences[field] = inProductWords(message);
    }
  }

  if (messages.length === 0) {
    return { kind: 'failed' };
  }

  return { kind: 'fields', sentences, other };
}

function inProductWords(message: string): string {
  if (message === 'email must be an email address') {
    return 'That does not look like an email address.';
  }

  if (message.startsWith('password must be longer than or equal to')) {
    return TOO_SHORT;
  }

  return asSentence(message);
}

function asSentence(message: string): string {
  const capitalised = message.charAt(0).toUpperCase() + message.slice(1);

  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}
