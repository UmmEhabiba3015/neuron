import { SessionEntity } from '../entities/session.entity';
import { SessionResponseDto } from './session-response.dto';

describe('SessionResponseDto', () => {
  const session = Object.assign(new SessionEntity(), {
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'a'.repeat(64),
    createdAt: '2026-09-01T00:00:00.000Z',
    expiresAt: '2026-10-01T00:00:00.000Z',
    revokedAt: null,
  });

  it('carries the session and when it started, ends and was revoked, and never the hash', () => {
    const answer = new SessionResponseDto(session);

    expect(Object.keys(answer)).toEqual([
      'id',
      'userId',
      'createdAt',
      'expiresAt',
      'revokedAt',
    ]);
    expect(JSON.stringify(answer)).not.toContain('a'.repeat(64));
  });
});
