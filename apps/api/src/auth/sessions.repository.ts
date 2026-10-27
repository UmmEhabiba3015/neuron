import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsNull,
  LessThan,
  MoreThan,
  Repository,
  type EntityManager,
} from 'typeorm';
import { SessionEntity } from './entities/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessions: Repository<SessionEntity>,
  ) {}

  async save(session: SessionEntity): Promise<void> {
    await this.sessions.insert(session);
  }

  async findById(id: string): Promise<SessionEntity | undefined> {
    return (await this.sessions.findOneBy({ id })) ?? undefined;
  }

  async findActiveByUser(
    userId: string,
    now: string,
  ): Promise<SessionEntity[]> {
    return this.sessions.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      order: { lastUsedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /*
   * Ends one session of one person. The person is in the WHERE clause
   * (ADR-013), so another person's session is not found, exactly as a
   * session that does not exist is not. So is one that has already ended,
   * by a sign-out or by its expiry: false means nothing was ended.
   */
  async revoke(id: string, userId: string, now: string): Promise<boolean> {
    const result = await this.sessions.update(
      { id, userId, revokedAt: IsNull(), expiresAt: MoreThan(now) },
      { revokedAt: now },
    );

    return result.affected !== 0;
  }

  async revokeAllForUser(
    userId: string,
    now: string,
    manager: EntityManager = this.sessions.manager,
  ): Promise<number> {
    const result = await manager.update(
      SessionEntity,
      { userId, revokedAt: IsNull() },
      { revokedAt: now },
    );

    return result.affected ?? 0;
  }

  /* A refresh: a new token hash, and the moment the session was last used. */
  async rotate(
    id: string,
    refreshTokenHash: string,
    lastUsedAt: string,
  ): Promise<void> {
    await this.sessions.update({ id }, { refreshTokenHash, lastUsedAt });
  }

  async deleteExpiredBefore(now: string): Promise<number> {
    const result = await this.sessions.delete({ expiresAt: LessThan(now) });

    return result.affected ?? 0;
  }
}
