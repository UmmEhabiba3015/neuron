import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  const service = new RefreshTokenService();

  it('generates 32 random bytes as 43 characters of base64url', () => {
    const token = service.generate();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(service.generate()).not.toBe(token);
  });

  it('hashes to SHA-256 hex, which contains nothing of the token', () => {
    const token = service.generate();
    const hash = service.hash(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
  });

  it('matches a token against its own hash and no other', () => {
    const token = service.generate();
    const hash = service.hash(token);

    expect(service.matches(token, hash)).toBe(true);
    expect(service.matches(service.generate(), hash)).toBe(false);
    expect(service.matches(token, 'not-a-hash')).toBe(false);
  });
});
