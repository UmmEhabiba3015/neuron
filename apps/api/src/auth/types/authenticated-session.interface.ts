import type { UserEntity } from '../../users/entities/user.entity';

/*
 * A session that has just been started or refreshed: both tokens, and the
 * person they belong to. It stays inside the API; the controller sends the
 * access token in the body and the refresh token in the cookie.
 */
export interface AuthenticatedSession {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  user: UserEntity;
}
