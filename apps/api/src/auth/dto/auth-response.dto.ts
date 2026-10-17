import type { AuthResponse } from '@neuron/contracts';
import { UserResponseDto } from '../../shared/dto/user-response.dto';
import type { AuthenticatedSession } from '../types/authenticated-session.interface';

/*
 * The answer to POST /auth/login and POST /auth/refresh. The refresh token
 * leaves in the cookie and only in the cookie, so it has no field here.
 */
export class AuthResponseDto implements AuthResponse {
  accessToken: string;
  user: UserResponseDto;

  constructor(session: AuthenticatedSession) {
    this.accessToken = session.accessToken;
    this.user = new UserResponseDto(session.user);
  }
}
