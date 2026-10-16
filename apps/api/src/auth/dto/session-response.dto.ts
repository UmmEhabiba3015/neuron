import type { Session } from '@neuron/contracts';
import { deviceName } from '../device-name';
import type { SessionEntity } from '../entities/session.entity';

/*
 * A device where the person is signed in, as GET /auth/sessions sends it.
 * Built field by field, so the refresh token hash, the user id and the user
 * agent, which the entity also holds, cannot follow it into a response.
 *
 * The device's name is made here from the user agent, and is never stored.
 * `current` is true for the session that asked, which only the request
 * knows, so it is handed in.
 *
 * The order of the declarations is the order of the keys.
 */
export class SessionResponseDto implements Session {
  id: string;
  device: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;

  constructor(session: SessionEntity, currentSessionId: string) {
    this.id = session.id;
    this.device = deviceName(session.userAgent);
    this.createdAt = session.createdAt;
    this.lastUsedAt = session.lastUsedAt;
    this.current = session.id === currentSessionId;
  }
}
