'use client';

import { NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@neuron/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { AuthScreen, BlankScreen } from '@/components/layout/AuthScreen';
import { useSession } from '@/hooks/useSession';
import {
  FIELDS,
  placeMessages,
  readForm,
  type Details,
  type FieldName,
  type FormProblems,
  type Mode,
} from '@/lib/account-form';
import { session } from '@/lib/api/client';
import type { ApiResult } from '@/lib/api/session';
import { CouldNotConnect } from '@/components/layout/CouldNotConnect';

/*
 * `name` and `confirmation` exist on create account only, and the
 * confirmation is never sent.
 */
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

export const NO_EMAIL = 'Enter an email address.';
const TOO_SHORT = `Enter a password with at least ${PASSWORD_MIN_LENGTH} characters.`;

const NO_NAME = 'Enter your name.';
const NAME_TOO_LONG = `Enter a name with at most ${NAME_MAX_LENGTH} characters.`;

/*
 * What is wrong is decided in lib/account-form.ts. This puts each problem in
 * words.
 */
export const SENTENCES: Record<NonNullable<FormProblems[FieldName]>, string> = {
  noName: NO_NAME,
  nameTooLong: NAME_TOO_LONG,
  notAnEmail: NO_EMAIL,
  noPassword: 'Enter your password.',
  tooShort: TOO_SHORT,
  notRepeated: 'Enter your password again.',
  notMatching:
    'The passwords do not match. Enter the same password in both fields.',
};

/*
 * No field is at fault here, and nothing the person types can change it, so
 * it is said where failures of the whole form are said.
 */
const NO_TIMEZONE =
  'This browser did not give us a timezone we can use, so your account was not created. Nothing you typed is wrong. Try again in another browser.';

const LIMITS = {
  passwordMinLength: PASSWORD_MIN_LENGTH,
  nameMaxLength: NAME_MAX_LENGTH,
};

/*
 * The one place the browser is asked which timezone the person is in. The
 * answer is handed to the session as it is. Nothing is put in its place when
 * it is missing: the API refuses the registration, and the form says so.
 */
function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/* Shared with the screens of a forgotten password, in Recover.tsx. */
export const COULD_NOT_REACH =
  'We could not reach the server. Your details are still here. Try again.';
export const SOMETHING_WENT_WRONG =
  'Something went wrong on our side. Nothing was changed.';

/* Said once, by sign in, when /reset has sent the person there. */
const PASSWORD_CHANGED =
  'Your password has been changed, and every device has been signed out. Sign in with your new password.';

const WORDS = {
  in: {
    heading: 'Log in',
    copy: 'Open your journal on this device.',
    submit: 'Log in',
    sending: 'Signing you in.',
    unreachable: COULD_NOT_REACH,
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

export function AuthForm({
  mode,
  afterReset = false,
}: {
  mode: Mode;
  afterReset?: boolean;
}) {
  const state = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
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
   * (docs/features.md, Ref 1).
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

    const reading = readForm(
      mode,
      { name, email, password, confirmation },
      LIMITS,
    );

    if (!reading.send) {
      const sentences: FieldSentences = {};

      for (const field of FIELDS) {
        const problem = reading.problems[field];

        if (problem) {
          sentences[field] = SENTENCES[problem];
        }
      }

      setOutcome({ kind: 'fields', sentences, other: [] });
      document.getElementById(reading.first)?.focus();
      return;
    }

    inFlight.current = true;
    setSending(true);

    const { details } = reading;
    const next =
      mode === 'in'
        ? outcomeOf(
            await session.login(details.email, details.password),
            'login',
          )
        : await createAccount(details);

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
  const changed = mode === 'in' && afterReset && outcome.kind === 'none';
  const ended =
    !changed && mode === 'in' && state.ended && outcome.kind === 'none';
  const sentences = outcome.kind === 'fields' ? outcome.sentences : {};

  const notice =
    outcome.kind === 'refused'
      ? ['We could not sign you in with those details.']
      : outcome.kind === 'taken'
        ? ['There is already an account with this email.']
        : outcome.kind === 'unreachable'
          ? [words.unreachable]
          : outcome.kind === 'failed'
            ? [SOMETHING_WENT_WRONG]
            : outcome.kind === 'fields'
              ? outcome.other
              : changed
                ? [PASSWORD_CHANGED]
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
            role={ended || changed ? 'status' : 'alert'}
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
        {mode === 'new' ? (
          <div className="auth-field">
            <label htmlFor="name">Name</label>
            <div className="field-inner">
              <input
                className="field"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  typed('name');
                }}
                aria-invalid={sentences.name ? true : undefined}
                aria-describedby={sentences.name ? 'name-help' : undefined}
              />
              {sentences.name ? (
                <p className="auth-help" id="name-help">
                  {sentences.name}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

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
          after={
            mode === 'in' ? (
              <Link className="btn quiet forgot password-note" href="/forgot">
                Forgot your password?
              </Link>
            ) : undefined
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
 * Each field has its own control.
 *
 * A press with a mouse or a finger leaves focus where it was, so a person
 * typing can look at what they typed and go on typing. The cursor and any
 * selection are put back after the type changes, because Chrome moves the
 * cursor to the start when it does. A press from the keyboard leaves focus
 * on the control, as any button does.
 *
 * A sentence about a problem takes the hint's place. The two never show
 * together (V3-REVISION.md). `after` is drawn under both, where 13-login.html
 * draws "Forgot your password?".
 */
export function PasswordField({
  id,
  label,
  what,
  autoComplete,
  value,
  onChange,
  problem,
  hint,
  after,
}: {
  id: string;
  label: string;
  what: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  problem?: string;
  hint?: string;
  after?: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const selection = useRef<[number | null, number | null] | null>(null);
  const help = problem ?? hint;

  /*
   * Chrome moves the cursor to the start once it has drawn the field with
   * its new type, after this effect has run, so the cursor is put back on
   * the next frame.
   */
  useEffect(() => {
    const kept = selection.current;
    selection.current = null;

    if (!kept) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const input = field.current;

      if (input && document.activeElement === input) {
        input.setSelectionRange(kept[0], kept[1]);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [shown]);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="field-inner">
        <div className="password-control">
          <input
            className="field"
            id={id}
            name={id}
            ref={field}
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
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const input = field.current;

              selection.current = input
                ? [input.selectionStart, input.selectionEnd]
                : null;
              setShown(!shown);
            }}
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
        {after}
      </div>
    </div>
  );
}

/*
 * The register endpoint does not sign the user in, and a new account is
 * signed in at once (docs/features.md, Ref 1), so this registers and then
 * logs in.
 */
async function createAccount(details: Details): Promise<Outcome> {
  const registered = outcomeOf(
    await session.register({ ...details, timezone: browserTimeZone() }),
    'register',
  );

  if (registered.kind !== 'none') {
    return registered;
  }

  return outcomeOf(
    await session.login(details.email, details.password),
    'login',
  );
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

/*
 * Which field each message is about is decided in lib/account-form.ts. The
 * messages the API sends in practice are replaced with this product's own
 * wording.
 */
function fromApiMessages(messages: string[]): Outcome {
  if (messages.length === 0) {
    return { kind: 'failed' };
  }

  const refusal = placeMessages(messages);
  const sentences: FieldSentences = {};

  for (const field of FIELDS) {
    const message =
      field === 'confirmation' ? undefined : refusal.fields[field];

    if (message) {
      sentences[field] = inProductWords(message);
    }
  }

  return {
    kind: 'fields',
    sentences,
    other: [
      ...(refusal.timezone ? [NO_TIMEZONE] : []),
      ...refusal.other.map(asSentence),
    ],
  };
}

export function inProductWords(message: string): string {
  if (message === 'email must be an email address') {
    return NO_EMAIL;
  }

  if (message.startsWith('password must be longer than or equal to')) {
    return TOO_SHORT;
  }

  if (message.startsWith('name must contain at least one character')) {
    return NO_NAME;
  }

  if (message.startsWith('name must be shorter than or equal to')) {
    return NAME_TOO_LONG;
  }

  return asSentence(message);
}

function asSentence(message: string): string {
  const capitalised = message.charAt(0).toUpperCase() + message.slice(1);

  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}
