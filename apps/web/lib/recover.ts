/*
 * The rules of the two screens of a forgotten password: /forgot, which asks
 * for a link, and /reset, which the link opens.
 *
 * Like account-form.ts, this file has no React in it and is tested with Node
 * alone. It says what happened, and the screens say it in words. The checks
 * of a new password are the ones of create account, from account-form.ts.
 */
import type { ApiResult } from './api/session.ts';
import {
  checkNewPassword,
  looksLikeEmail,
  placeMessages,
} from './account-form.ts';

/*
 * Where /reset sends a person whose password was changed. Sign in reads the
 * mark and says what happened. It is in the address and nowhere else, so it
 * is gone once the person signs in and leaves the page.
 */
export const SIGN_IN_AFTER_RESET = '/in?reset=done';

export function isAfterReset(mark: string | string[] | undefined): boolean {
  return mark === 'done';
}

/*
 * The token from /reset?token=... A missing or empty one is no token. The
 * token itself is passed on exactly as it came: it is the API's to judge.
 */
export function tokenFrom(value: string | string[] | undefined): string | null {
  const token = Array.isArray(value) ? value[0] : value;

  return token === undefined || token.trim() === '' ? null : token;
}

/* /forgot. The address loses the spaces at its two ends, as on sign in. */
export type ForgotReading = { send: false } | { send: true; email: string };

export function readForgotForm(typed: string): ForgotReading {
  const email = typed.trim();

  return looksLikeEmail(email) ? { send: true, email } : { send: false };
}

/*
 * Every answer from the server is the same to the person, a refusal
 * included: whether an account uses the address is never said. Only no
 * answer at all is different, because then nothing was asked.
 */
export type ForgotOutcome = 'sent' | 'unreachable';

export function forgotOutcome(result: ApiResult<unknown>): ForgotOutcome {
  return result.kind === 'unreachable' ? 'unreachable' : 'sent';
}

/* /reset. The new password, typed twice, as on create account. */
export interface NewPasswordProblems {
  password?: 'tooShort';
  confirmation?: 'notRepeated' | 'notMatching';
}

export type ResetReading =
  | {
      send: false;
      problems: NewPasswordProblems;
      first: keyof NewPasswordProblems;
    }
  | { send: true; password: string };

export function readResetForm(
  password: string,
  confirmation: string,
  minLength: number,
): ResetReading {
  const problem = checkNewPassword(password, confirmation, minLength);

  if (problem === null) {
    return { send: true, password };
  }

  return problem === 'tooShort'
    ? { send: false, problems: { password: problem }, first: 'password' }
    : {
        send: false,
        problems: { confirmation: problem },
        first: 'confirmation',
      };
}

/*
 * `changed`    the password is the new one, and every device is signed out.
 * `badLink`    the link is unknown, expired or used. The API gives the three
 *              one answer, and so does this.
 * `password`   the API refused the password itself; `message` is its words.
 * `unreachable` no answer arrived, so nothing was changed.
 * `failed`     any other answer.
 */
export type ResetOutcome =
  | { kind: 'changed' }
  | { kind: 'badLink' }
  | { kind: 'password'; message: string }
  | { kind: 'unreachable' }
  | { kind: 'failed' };

export function resetOutcome(result: ApiResult<unknown>): ResetOutcome {
  if (result.kind === 'ok') {
    return { kind: 'changed' };
  }

  if (result.kind === 'unreachable') {
    return { kind: 'unreachable' };
  }

  if (result.kind === 'rejected' && result.status === 400) {
    const message = placeMessages(result.messages).fields.password;

    return message ? { kind: 'password', message } : { kind: 'badLink' };
  }

  return { kind: 'failed' };
}
