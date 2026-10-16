import { SessionEntity } from '../entities/session.entity';
import { SessionResponseDto } from './session-response.dto';

describe('SessionResponseDto', () => {
  const USER_AGENT =
    'Mozilla/5.0 (X11; Linux x86_64; rv:157.0) Gecko/20100101 Firefox/157.0';

  const session = Object.assign(new SessionEntity(), {
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'a'.repeat(64),
    createdAt: '2026-09-01T00:00:00.000Z',
    expiresAt: '2026-10-01T00:00:00.000Z',
    revokedAt: null,
    userAgent: USER_AGENT,
    lastUsedAt: '2026-09-05T00:00:00.000Z',
  });

  it('carries the session, its device, when it began and was last used, and whether it is this one', () => {
    const answer = new SessionResponseDto(session, 'session-1');

    expect(Object.keys(answer)).toEqual([
      'id',
      'device',
      'createdAt',
      'lastUsedAt',
      'current',
    ]);
    expect(answer).toEqual({
      id: 'session-1',
      device: 'Firefox on Linux',
      createdAt: '2026-09-01T00:00:00.000Z',
      lastUsedAt: '2026-09-05T00:00:00.000Z',
      current: true,
    });
  });

  it('is not current when another session asked', () => {
    expect(new SessionResponseDto(session, 'session-2').current).toBe(false);
  });

  it('never carries the hash, the user id or the user agent', () => {
    const json = JSON.stringify(new SessionResponseDto(session, 'session-1'));

    expect(json).not.toContain('a'.repeat(64));
    expect(json).not.toContain('user-1');
    expect(json).not.toContain('Gecko');
  });
});
