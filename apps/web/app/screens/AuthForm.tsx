'use client';

import { PASSWORD_MIN_LENGTH } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { AuthScreen, BlankScreen } from '@/app/components/AuthScreen';
import { useSession } from '@/app/components/useSession';
import {
  checkNewPassword,
  fieldOf,
  looksLikeEmail,
  type PasswordProblem,
} from '@/lib/account-form';
import { session } from '@/lib/api';
import type { ApiResult } from '@/lib/session';
import { CouldNotConnect } from './CouldNotConnect';

type Mode = 'in' | 'new';

/* `confirmation` exists on create account only, and is never sent. */
type FieldName = 'email' | 'password' | 'confirmation';
type FieldSentences = Partial<Record<FieldName, string>>;

/*
 * `unreachable` and `refused` are never merged: no answer from the server and
 * a refusal by it are different facts.
 */
type Outcome =
  | { kind: 'none' }
  | { kind: 'fields'; sentences: FieldSentences; other: string[] }
  | { kind: 'refused' }
  | { kind: 'taken' }
  | { kind: 'unreachable' }
  | { kind: 'failed' };

const NO_EMAIL = 'Enter an email address.';
const TOO_SHORT = `Enter a password with at least ${PASSWORD_MIN_LENGTH} characters.`;

const PASSWORD_SENTENCES: Record<PasswordProblem, string> = {
  tooShort: TOO_SHORT,
  notRepeated: 'Enter your password again.',
  notMatching:
    'The passwords do not match. Enter the same password in both fields.',
};

const WORDS = {
  in: {
    heading: 'Log in',
    copy: 'Open your journal on this device.',
    submit: 'Log in',
    sending: 'Signing you in.',
    unreachable:
      'We could not reach the server. Your details are still here. Try again.',
    passwordAutoComplete: 'current-password',
  },
  new: {
    heading: 'Create an account',
    copy: 'Create an account to begin your private journal.',
    submit: 'Create account',
    sending: 'Creating your account. You will open on Today.',
    unreachable:
      'We could not reach the server. Your email and password are still in the form.',
    passwordAutoComplete: 'new-password',
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const state = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'none' });
  const [sending, setSending] = useState(false);

  /*
   * The opening line is typed out once, on arrival. After a press it is a
   * second state of the same screen, and is not typed again.
   */
  const [pressed, setPressed] = useState(false);

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
    return <CouldNotConnect asking={state.asking} asked={state.asked} />;
  }

  if (state.status !== 'signedOut') {
    return <BlankScreen />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    setPressed(true);

    const address = email.trim();
    const sentences = checkFields(mode, address, password, confirmation);
    const first = (['email', 'password', 'confirmation'] as const).find(
      (name) => sentences[name],
    );

    if (first) {
      setOutcome({ kind: 'fields', sentences, other: [] });
      document.getElementById(first)?.focus();
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

  /* Typing in a field takes its sentence away until the next press. */
  function typed(...names: FieldName[]) {
    if (outcome.kind !== 'fields') {
      return;
    }

    const sentences = { ...outcome.sentences };
    names.forEach((name) => delete sentences[name]);
    setOutcome({ ...outcome, sentences });
  }

  const words = WORDS[mode];
  const ended = mode === 'in' && state.ended && outcome.kind === 'none';
  const sentences = outcome.kind === 'fields' ? outcome.sentences : {};

  const notice =
    outcome.kind === 'refused'
      ? ['We could not sign you in with those details.']
      : outcome.kind === 'taken'
        ? ['There is already an account with this email.']
        : outcome.kind === 'unreachable'
          ? [words.unreachable]
          : outcome.kind === 'failed'
            ? ['Something went wrong on our side. Nothing was changed.']
            : outcome.kind === 'fields'
              ? outcome.other
              : ended
                ? ['You were signed out. Sign in again to open your journal.']
                : [];

  return (
    <AuthScreen>
      <h2 className="auth-heading" id="auth-heading">
        {words.heading}
      </h2>

      {/* One place, three things: the request in flight, what went wrong,
          or the opening line. A press is always seen (ADR-021). Once a field
          has been given a sentence the opening line stays away, as it does
          in 15-auth-states.html, so that typing does not move the form. */}
      {sending ? (
        <p className="auth-copy" role="status">
          {words.sending}
        </p>
      ) : notice.length > 0 ? (
        notice.map((sentence) => (
          <div
            className="notice"
            role={ended ? 'status' : 'alert'}
            key={sentence}
          >
            {sentence}
          </div>
        ))
      ) : outcome.kind === 'fields' ? null : (
        <p className="auth-copy">
          <span
            className="gline"
            data-motion-copy={pressed ? undefined : ''}
            style={{ '--g-copy-count': words.copy.length } as CSSProperties}
          >
            {words.copy}
          </span>
        </p>
      )}

      {/* noValidate: the browser's own bubbles would replace the sentence
          that belongs beside the field. */}
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
                typed('email');
              }}
              aria-invalid={sentences.email ? true : undefined}
              aria-describedby={sentences.email ? 'email-help' : undefined}
            />
            {sentences.email ? (
              <p className="auth-help" id="email-help">
                {sentences.email}
              </p>
            ) : null}
          </div>
        </div>

        <PasswordField
          id="password"
          label="Password"
          what="password"
          autoComplete={words.passwordAutoComplete}
          value={password}
          onChange={(value) => {
            setPassword(value);
            typed('password', 'confirmation');
          }}
          problem={sentences.password}
          hint={
            mode === 'new'
              ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
              : undefined
          }
        />

        {mode === 'new' ? (
          <PasswordField
            id="confirmation"
            label="Confirm password"
            what="confirmed password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(value) => {
              setConfirmation(value);
              typed('confirmation');
            }}
            problem={sentences.confirmation}
          />
        ) : null}

        <button className="btn solid" type="submit">
          {outcome.kind === 'unreachable' && !sending
            ? 'Try again'
            : words.submit}
        </button>
      </form>

      <div className="auth-actions">
        {mode === 'in' ? (
          <Link className="btn quiet" href="/new">
            Create an account
          </Link>
        ) : (
          <>
            <span className="switch-context">Already have an account?</span>
            <Link className="btn quiet" href="/in">
              Log in
            </Link>
          </>
        )}
      </div>
    </AuthScreen>
  );
}

/*
 * A password field and its show-password control. The control changes the
 * field's type and nothing else: the value is React's, so it is not cleared.
 *
 * A sentence about a problem takes the hint's place. The two never show
 * together (V3-REVISION.md).
 */
function PasswordField({
  id,
  label,
  what,
  autoComplete,
  value,
  onChange,
  problem,
  hint,
}: {
  id: string;
  label: string;
  what: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  problem?: string;
  hint?: string;
}) {
  const [shown, setShown] = useState(false);
  const help = problem ?? hint;

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="field-inner">
        <div className="password-control">
          <input
            className="field"
            id={id}
            name={id}
            type={shown ? 'text' : 'password'}
            autoComplete={autoComplete}
            required
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={problem ? true : undefined}
            aria-describedby={help ? `${id}-help` : undefined}
          />
          <button
            className="btn quiet password-toggle"
            type="button"
            aria-controls={id}
            aria-label={`${shown ? 'Hide' : 'Show'} ${what}`}
            aria-pressed={shown}
            onClick={() => setShown(!shown)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2.5 12c2.4-3.5 5.5-5.25 9.5-5.25s7.1 1.75 9.5 5.25c-2.4 3.5-5.5 5.25-9.5 5.25S4.9 15.5 2.5 12Z" />
              <circle cx="12" cy="12" r="2.5" />
              <path className="eye-slash" d="M3 3l18 18" />
            </svg>
          </button>
        </div>
        {help ? (
          <p
            className={problem ? 'auth-help' : 'auth-help password-note'}
            id={`${id}-help`}
          >
            {help}
          </p>
        ) : null}
      </div>
    </div>
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

/* What is wrong is decided in lib/account-form.ts. This puts it in words. */
function checkFields(
  mode: Mode,
  email: string,
  password: string,
  confirmation: string,
): FieldSentences {
  const sentences: FieldSentences = {};

  if (!looksLikeEmail(email)) {
    sentences.email = NO_EMAIL;
  }

  if (mode === 'in') {
    if (password === '') {
      sentences.password = 'Enter your password.';
    }

    return sentences;
  }

  const problem = checkNewPassword(password, confirmation, PASSWORD_MIN_LENGTH);

  if (problem) {
    sentences[fieldOf(problem)] = PASSWORD_SENTENCES[problem];
  }

  return sentences;
}

/*
 * Each message begins with the name of the field it is about, which is how it
 * finds its place. The two the API sends in practice are replaced with this
 * product's own wording.
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
    return NO_EMAIL;
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
