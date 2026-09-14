import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwordService = new PasswordService();

  it('should never return the password it was given', async () => {
    const password = 'a-long-enough-password';

    const hash = await passwordService.hash(password);

    expect(hash).not.toBe(password);
    expect(hash).not.toContain(password);
  });

  it('should produce a self-describing argon2id hash', async () => {
    const hash = await passwordService.hash('a-long-enough-password');

    expect(hash).toMatch(/^\$argon2id\$v=\d+\$m=\d+,p=\d+,t=\d+\$/);
  });

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

  it('should return false rather than throw on a malformed stored hash', async () => {
    expect(await passwordService.verify('not-a-hash', 'any-password')).toBe(
      false,
    );
    expect(await passwordService.verify('', 'any-password')).toBe(false);
  });

  it('should not truncate long passwords the way bcrypt does', async () => {
    const base = 'x'.repeat(72);

    const hash = await passwordService.hash(base + 'FIRST');

    expect(await passwordService.verify(hash, base + 'FIRST')).toBe(true);
    expect(await passwordService.verify(hash, base + 'SECOND')).toBe(false);
  });
});
