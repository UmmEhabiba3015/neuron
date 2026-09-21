import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { Session } from './session.entity';
import { SessionsRepository } from './sessions.repository';
import { TokenService } from './token.service';

export const REFRESH_TOKEN_LIFETIME_DAYS = 30;

export interface AuthenticatedSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async login(
    name: string,
    password: string,
  ): Promise<AuthenticatedSession | undefined> {
    const user = await this.usersService.findByName(name);

    if (!user?.passwordHash) {
      await this.passwordService.verify(UNKNOWN_USER_HASH, password);

      return undefined;
    }

    if (!(await this.passwordService.verify(user.passwordHash, password))) {
      return undefined;
    }

    return this.startSession(user);
  }

  async refresh(
    sessionId: string,
    refreshToken: string,
  ): Promise<AuthenticatedSession | undefined> {
    const session = await this.sessionsRepository.findById(sessionId);
    const now = new Date();

    if (!session || session.revokedAt || session.expiresAt <= toIso(now)) {
      return undefined;
    }

    if (
      !this.refreshTokenService.matches(refreshToken, session.refreshTokenHash)
    ) {
      await this.sessionsRepository.revokeAllForUser(
        session.userId,
        toIso(now),
      );

      return undefined;
    }

    const user = await this.usersService.findById(session.userId);

    if (!user) {
      return undefined;
    }

    const nextRefreshToken = this.refreshTokenService.generate();

    await this.sessionsRepository.rotate(
      session.id,
      this.refreshTokenService.hash(nextRefreshToken),
    );

    return {
      accessToken: await this.tokenService.sign(user, session.id),
      refreshToken: nextRefreshToken,
      user,
    };
  }

  async logout(sessionId: string): Promise<boolean> {
    return this.sessionsRepository.revoke(sessionId, toIso(new Date()));
  }

  async logoutEverywhere(userId: string): Promise<number> {
    return this.sessionsRepository.revokeAllForUser(userId, toIso(new Date()));
  }

  listSessions(userId: string): Promise<Session[]> {
    return this.sessionsRepository.findActiveByUser(userId, toIso(new Date()));
  }

  private async startSession(user: User): Promise<AuthenticatedSession> {
    const refreshToken = this.refreshTokenService.generate();
    const now = new Date();

    const session = new Session();
    session.id = randomUUID();
    session.userId = user.id;
    session.refreshTokenHash = this.refreshTokenService.hash(refreshToken);
    session.createdAt = toIso(now);
    session.expiresAt = toIso(
      new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_DAYS * 86_400_000),
    );
    session.revokedAt = null;

    await this.sessionsRepository.save(session);

    return {
      accessToken: await this.tokenService.sign(user, session.id),
      refreshToken,
      user,
    };
  }
}

const toIso = (date: Date): string => date.toISOString();

const UNKNOWN_USER_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$soIwesaY19HtJeFNdUXeeQ$FSgzNZ7zyOFVvqDyK5PWYK/9ogzD3OWRJxKOKrL5Ru4';
