import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, type EntityManager } from 'typeorm';
import { PasswordResetEntity } from './entities/password-reset.entity';

@Injectable()
export class PasswordResetsRepository {
  constructor(
    @InjectRepository(PasswordResetEntity)
    private readonly resets: Repository<PasswordResetEntity>,
  ) {}

  async save(reset: PasswordResetEntity): Promise<void> {
    await this.resets.insert(reset);
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetEntity | undefined> {
    return (await this.resets.findOneBy({ tokenHash })) ?? undefined;
  }

  /*
   * Only a reset that is still unused is marked, and the answer says whether
   * this call was the one that marked it. Two requests with the same link at
   * the same moment both find it unused, and only one of them gets true.
   */
  async markUsed(
    id: string,
    now: string,
    manager: EntityManager = this.resets.manager,
  ): Promise<boolean> {
    const result = await manager.update(
      PasswordResetEntity,
      { id, usedAt: IsNull() },
      { usedAt: now },
    );

    return result.affected !== 0;
  }

  async markAllUsedForUser(
    userId: string,
    now: string,
    manager: EntityManager = this.resets.manager,
  ): Promise<number> {
    const result = await manager.update(
      PasswordResetEntity,
      { userId, usedAt: IsNull() },
      { usedAt: now },
    );

    return result.affected ?? 0;
  }
}
