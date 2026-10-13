import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenPayload } from './types/access-token-payload.interface';
import type { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(user: UserEntity, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      sid: sessionId,
    };

    return this.jwtService.signAsync(payload);
  }

  async verify(token: string): Promise<AccessTokenPayload | undefined> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      return undefined;
    }
  }
}
