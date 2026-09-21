import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../users/user.entity';

export interface AccessTokenPayload {
  sub: string;
  name: string;
  sid: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(user: User, sessionId: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      name: user.name,
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
