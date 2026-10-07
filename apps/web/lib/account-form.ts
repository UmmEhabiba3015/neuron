/*
 * The rules of the sign-in and create-account forms.
 *
 * Like today.ts, this file has no React in it and imports nothing that
 * exists when it runs, so it is tested with Node alone. The minimum length
 * is handed in. The sentences are the screen's: this file says what is
 * wrong, and the screen says it in words.
 *
 * Everything here is checked in the browser, before anything is sent. The
 * second password field never leaves the browser at all: the API receives
 * an email and one password (the contract's WireRegistration).
 */

/*
 * `tooShort` is about the first field. `notRepeated` and `notMatching` are
 * about the second.
 */
export type PasswordProblem = 'tooShort' | 'notRepeated' | 'notMatching';

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

export function fieldOf(problem: PasswordProblem): 'password' | 'confirmation' {
  return problem === 'tooShort' ? 'password' : 'confirmation';
}

/* Something, an @, and something, with no spaces. The API decides the rest. */
export function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(email);
}
