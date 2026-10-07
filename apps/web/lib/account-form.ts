/*
 * The rules of the sign-in and create-account forms.
 *
 * Like today.ts, this file has no React in it and imports nothing that
 * exists when it runs, so it is tested with Node alone. The two limits are
 * handed in. The sentences are the screen's: this file says what is wrong,
 * and the screen says it in words.
 *
 * Everything here is checked in the browser, before anything is sent, and
 * the API checks again and is the authority. The second password field never
 * leaves the browser at all (the contract's WireRegistration has no place
 * for it).
 */

export type Mode = 'in' | 'new';

/* What the person typed, exactly as typed. Sign in has only two of these. */
export interface Typed {
  name: string;
  email: string;
  password: string;
  confirmation: string;
}

export interface Limits {
  passwordMinLength: number;
  nameMaxLength: number;
}

/*
 * `tooShort` is about the first field. `notRepeated` and `notMatching` are
 * about the second.
 */
export type PasswordProblem = 'tooShort' | 'notRepeated' | 'notMatching';

export type NameProblem = 'noName' | 'nameTooLong';

/* At most one problem for each field. A field with none is not listed. */
export interface FormProblems {
  name?: NameProblem;
  email?: 'notAnEmail';
  /* `noPassword` is sign in's. A new password that is empty is `tooShort`. */
  password?: 'noPassword' | 'tooShort';
  confirmation?: 'notRepeated' | 'notMatching';
}

export type FieldName = keyof FormProblems;

/* The order of the fields on the screen, which is the order they are read in. */
export const FIELDS: readonly FieldName[] = [
  'name',
  'email',
  'password',
  'confirmation',
];

/*
 * What goes to the API. The name and the email have lost the spaces at their
 * two ends. The password is exactly as typed. Sign in sends no name.
 */
export interface Details {
  name: string;
  email: string;
  password: string;
}

/* `first` is the first field, in screen order, that has a problem. */
export type Reading =
  | { send: false; problems: FormProblems; first: FieldName }
  | { send: true; details: Details };

/*
 * The one decision about what stops a send. Given which form it is and what
 * was typed, it answers either the problems, or what to send.
 *
 * The name and the email are trimmed before they are judged, so what is
 * judged is what would be sent.
 */
export function readForm(mode: Mode, typed: Typed, limits: Limits): Reading {
  const details: Details = {
    name: mode === 'new' ? typed.name.trim() : '',
    email: typed.email.trim(),
    password: typed.password,
  };

  const problems: FormProblems = {};

  if (mode === 'new') {
    const name = checkName(details.name, limits.nameMaxLength);

    if (name) {
      problems.name = name;
    }
  }

  if (!looksLikeEmail(details.email)) {
    problems.email = 'notAnEmail';
  }

  if (mode === 'in') {
    if (typed.password === '') {
      problems.password = 'noPassword';
    }
  } else {
    const password = checkNewPassword(
      typed.password,
      typed.confirmation,
      limits.passwordMinLength,
    );

    if (password === 'tooShort') {
      problems.password = password;
    } else if (password) {
      problems.confirmation = password;
    }
  }

  const first = FIELDS.find((field) => problems[field]);

  return first ? { send: false, problems, first } : { send: true, details };
}

/* Judges a name that has already been trimmed. */
export function checkName(name: string, maxLength: number): NameProblem | null {
  if (name === '') {
    return 'noName';
  }

  return lengthOf(name) > maxLength ? 'nameTooLong' : null;
}

/*
 * How many characters the API will count. `.length` counts most emoji as
 * two, and the API's check counts them as one, so `.length` would refuse a
 * name the API accepts. This counts whole characters, and does not count the
 * two invisible marks that only choose how the character before them is
 * drawn. It never counts more than the API does.
 */
function lengthOf(text: string): number {
  return Array.from(text.replace(/[\uFE0E\uFE0F]/g, '')).length;
}

/*
 * One problem at a time, and the first field's comes first. While the
 * password is too short the second field is not judged: the person is about
 * to type the password again, and the second field after it.
 *
 * The two are compared exactly as typed. Nothing is trimmed, and a capital
 * letter is not the same as a small one.
 */
export function checkNewPassword(
  password: string,
  confirmation: string,
  minLength: number,
): PasswordProblem | null {
  if (password.length < minLength) {
    return 'tooShort';
  }

  if (confirmation === '') {
    return 'notRepeated';
  }

  if (confirmation !== password) {
    return 'notMatching';
  }

  return null;
}

/* Something, an @, and something, with no spaces. The API decides the rest. */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(email);
}

/*
 * Where each message of a 400 from the API belongs.
 *
 * Each message begins with the name of the field it is about. For a field on
 * the form, the first message about it is kept, as the API wrote it. A
 * message about the timezone belongs to no field: the person did not type it
 * and cannot correct it. Anything else is kept in `other`.
 */
export interface Refusal {
  fields: { name?: string; email?: string; password?: string };
  timezone: boolean;
  other: string[];
}

export function placeMessages(messages: readonly string[]): Refusal {
  const refusal: Refusal = { fields: {}, timezone: false, other: [] };

  for (const message of messages) {
    const field = (['name', 'email', 'password'] as const).find((name) =>
      message.startsWith(`${name} `),
    );

    if (field) {
      refusal.fields[field] ??= message;
    } else if (message.startsWith('timezone ')) {
      refusal.timezone = true;
    } else {
      refusal.other.push(message);
    }
  }

  return refusal;
}
