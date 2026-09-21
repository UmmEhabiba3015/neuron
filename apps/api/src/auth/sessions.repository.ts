import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { Session } from './session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
  ) {}

  async save(session: Session): Promise<void> {
    await this.sessions.insert(session);
  }

  async findById(id: string): Promise<Session | undefined> {
    return (await this.sessions.findOneBy({ id })) ?? undefined;
  }

  async findActiveByUser(userId: string, now: string): Promise<Session[]> {
    return this.sessions.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(id: string, now: string): Promise<boolean> {
    const result = await this.sessions.update(
      { id, revokedAt: IsNull() },
      { revokedAt: now },
    );

    return result.affected !== 0;
  }

  async revokeAllForUser(userId: string, now: string): Promise<number> {
    const result = await this.sessions.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: now },
    );

    return result.affected ?? 0;
  }

  async rotate(id: string, refreshTokenHash: string): Promise<void> {
    await this.sessions.update({ id }, { refreshTokenHash });
  }

  async deleteExpiredBefore(now: string): Promise<number> {
    const result = await this.sessions.delete({ expiresAt: LessThan(now) });

    return result.affected ?? 0;
  }
}
