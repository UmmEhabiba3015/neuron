import { PasswordService } from './password.service';

// These tests are slow on purpose and that is the subject rather than a
// complaint: argon2 is ~60ms per hash by design, and a suite that ran instantly
// would mean the cost parameters were wrong.
describe('PasswordService', () => {
  const passwordService = new PasswordService();

  it('should never return the password it was given', async () => {
    const password = 'a-long-enough-password';

    const hash = await passwordService.hash(password);

    expect(hash).not.toBe(password);
    expect(hash).not.toContain(password);
  });

  // The PHC string: algorithm, version, parameters, salt and hash in one value.
  // Asserted because the whole schema decision rests on it — one column works
  // only because everything needed to verify travels inside this string.
  it('should produce a self-describing argon2id hash', async () => {
    const hash = await passwordService.hash('a-long-enough-password');

    expect(hash).toMatch(/^\$argon2id\$v=\d+\$m=\d+,p=\d+,t=\d+\$/);
  });

  // The salt, observed rather than described. Two hashes of one password must
  // differ, or an attacker reading the table learns which accounts share a
  // password and one precomputed table cracks all of them at once.
  it('should produce a different hash each time for the same password', async () => {
    const password = 'the-very-same-password';

    expect(await passwordService.hash(password)).not.toBe(
      await passwordService.hash(password),
    );
  });

  it('should verify the correct password against its own hash', async () => {
    const password = 'a-long-enough-password';

    const hash = await passwordService.hash(password);

    expect(await passwordService.verify(hash, password)).toBe(true);
  });

  it('should reject a wrong password', async () => {
    const hash = await passwordService.hash('a-long-enough-password');

    expect(await passwordService.verify(hash, 'the-wrong-password')).toBe(
      false,
    );
  });

  // A corrupted or pre-argon2 row is a failed login, not a 500. Returning false
  // keeps a malformed stored value from telling the caller anything about the
  // state of the database.
  it('should return false rather than throw on a malformed stored hash', async () => {
    expect(await passwordService.verify('not-a-hash', 'any-password')).toBe(
      false,
    );
    expect(await passwordService.verify('', 'any-password')).toBe(false);
  });

  // bcrypt silently truncates at 72 bytes, so a long passphrase would have its
  // tail ignored with no error and two different passwords could both verify.
  // argon2 has no such limit, and this pins that difference rather than
  // trusting it — it is one of the reasons ADR-011 went the way it did.
  it('should not truncate long passwords the way bcrypt does', async () => {
    const base = 'x'.repeat(72);

    const hash = await passwordService.hash(base + 'FIRST');

    expect(await passwordService.verify(hash, base + 'FIRST')).toBe(true);
    expect(await passwordService.verify(hash, base + 'SECOND')).toBe(false);
  });
});
