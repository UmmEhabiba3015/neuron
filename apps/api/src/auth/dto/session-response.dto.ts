import type { SessionEntity } from '../entities/session.entity';

/*
 * A signed-in session as GET /auth/sessions sends it. Built field by field,
 * so the refresh token hash, which the entity also holds, cannot follow it
 * into a response.
 *
 * The fields are declared in the order the JSON has always had them, and
 * the order of the declarations is the order of the keys.
 */
export class SessionResponseDto {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;

  constructor(session: SessionEntity) {
    this.id = session.id;
    this.userId = session.userId;
    this.createdAt = session.createdAt;
    this.expiresAt = session.expiresAt;
    this.revokedAt = session.revokedAt;
  }
}
