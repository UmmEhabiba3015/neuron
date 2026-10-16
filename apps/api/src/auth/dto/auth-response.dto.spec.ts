import { UserEntity } from '../../users/entities/user.entity';
import { AuthResponseDto } from './auth-response.dto';

describe('AuthResponseDto', () => {
  const answer = new AuthResponseDto({
    sessionId: 'session-1',
    accessToken: 'the.access.token',
    refreshToken: 'the-refresh-token-that-stays-in-the-cookie',
    user: Object.assign(new UserEntity(), {
      id: 'user-1',
      email: 'habiba@example.com',
      createdAt: '2026-09-01T00:00:00.000Z',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA',
      name: 'Habiba',
      timezone: 'UTC',
    }),
  });

  it('carries the access token and the user, and nothing else', () => {
    expect(Object.keys(answer)).toEqual(['accessToken', 'user']);
    expect(Object.keys(answer.user)).toEqual([
      'id',
      'email',
      'createdAt',
      'name',
      'timezone',
    ]);
  });

  it('keeps the refresh token and the session id out, for the cookie alone', () => {
    const json = JSON.stringify(answer);

    expect(json).not.toContain('the-refresh-token-that-stays-in-the-cookie');
    expect(json).not.toContain('session-1');
    expect(json).not.toContain('$argon2');
  });
});
