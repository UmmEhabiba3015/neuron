import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { SessionEntity } from './entities/session.entity';
import { SessionsRepository } from './sessions.repository';
import { TokenService } from './token.service';
import type { AuthenticatedSession } from './types/authenticated-session.interface';

export const REFRESH_TOKEN_LIFETIME_DAYS = 30;
export const REFRESH_TOKEN_LIFETIME_MS =
  REFRESH_TOKEN_LIFETIME_DAYS * 86_400_000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  /*
   * The user agent is the User-Agent header of the request, kept with the
   * session so that Account can name the device. A request may send none.
   */
  async login(
    email: string,
    password: string,
    userAgent?: string,
  ): Promise<AuthenticatedSession | undefined> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.passwordService.verify(UNKNOWN_USER_HASH, password);

      return undefined;
    }

    if (!(await this.passwordService.verify(user.passwordHash, password))) {
      return undefined;
    }

    return this.startSession(user, userAgent ?? null);
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
      toIso(now),
    );

    return {
      sessionId: session.id,
      accessToken: await this.tokenService.sign(user, session.id),
      refreshToken: nextRefreshToken,
      user,
    };
  }

  /*
   * Ends one session of this person: the one in use, for "Sign out of this
   * device", or another, for a device on Account. False when the person has
   * no such session still signed in.
   */
  async logout(userId: string, sessionId: string): Promise<boolean> {
    return this.sessionsRepository.revoke(sessionId, userId, toIso(new Date()));
  }

  async logoutEverywhere(userId: string): Promise<number> {
    return this.sessionsRepository.revokeAllForUser(userId, toIso(new Date()));
  }

  listSessions(userId: string): Promise<SessionEntity[]> {
    return this.sessionsRepository.findActiveByUser(userId, toIso(new Date()));
  }

  private async startSession(
    user: UserEntity,
    userAgent: string | null,
  ): Promise<AuthenticatedSession> {
    const refreshToken = this.refreshTokenService.generate();
    const now = new Date();

    const session = new SessionEntity();
    session.id = randomUUID();
    session.userId = user.id;
    session.refreshTokenHash = this.refreshTokenService.hash(refreshToken);
    session.createdAt = toIso(now);
    session.expiresAt = toIso(
      new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS),
    );
    session.revokedAt = null;
    session.userAgent = userAgent;
    session.lastUsedAt = session.createdAt;

    await this.sessionsRepository.save(session);

    return {
      sessionId: session.id,
      accessToken: await this.tokenService.sign(user, session.id),
      refreshToken,
      user,
    };
  }
}

const toIso = (date: Date): string => date.toISOString();

const UNKNOWN_USER_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$soIwesaY19HtJeFNdUXeeQ$FSgzNZ7zyOFVvqDyK5PWYK/9ogzD3OWRJxKOKrL5Ru4';
