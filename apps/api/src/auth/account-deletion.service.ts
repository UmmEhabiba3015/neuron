import { Injectable, Logger } from '@nestjs/common';
import { DataSource, type EntityTarget, type ObjectLiteral } from 'typeorm';
import { DayEntity } from '../days/entities/day.entity';
import { AudioKeysRepository } from '../entries/audio-keys.repository';
import { AudioStorage } from '../entries/audio-storage';
import { EntryEntity } from '../entries/entities/entry.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { SessionEntity } from './entities/session.entity';
import { PasswordService } from './password.service';

/*
 * The five tables an account owns rows in, children first. Every foreign key
 * is ON DELETE NO ACTION, so a row cannot go while another row points at it:
 * an entry points at its day and its user, a day, a reset and a session at
 * their user (ADR-024).
 */
export const ACCOUNT_TABLES_CHILDREN_FIRST: EntityTarget<ObjectLiteral>[] = [
  EntryEntity,
  DayEntity,
  PasswordResetEntity,
  SessionEntity,
  UserEntity,
];

/*
 * Deleting an account: a hard delete of the account and everything in it
 * (docs/features.md, Ref 8; ADR-024).
 */
@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly audioKeys: AudioKeysRepository,
    private readonly audioStorage: AudioStorage,
  ) {}

  /*
   * False, and nothing is changed, when the password is not the person's.
   *
   * The rows go in one transaction, so a crash before the commit leaves the
   * account whole. Soft-deleted entries go too: this is the moment ADR-020
   * kept them for. A delete by criteria is not filtered by @DeleteDateColumn,
   * so it reaches them without asking.
   *
   * The files go after the commit. The other order could leave an account
   * whose memos have lost their audio. A file that fails to go is logged and
   * left for the sweep at the next start, and the account is still deleted.
   */
  async delete(userId: string, password: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);

    if (
      !user ||
      !(await this.passwordService.verify(user.passwordHash, password))
    ) {
      return false;
    }

    const keys = await this.dataSource.transaction(async (manager) => {
      const owned = await this.audioKeys.ofUser(userId, manager);

      for (const table of ACCOUNT_TABLES_CHILDREN_FIRST) {
        await manager.delete(
          table,
          table === UserEntity ? { id: userId } : { userId },
        );
      }

      return owned;
    });

    for (const key of keys) {
      try {
        await this.audioStorage.remove(key);
      } catch (error: unknown) {
        this.logger.warn(
          `The account is deleted, and its audio file ${key} could not be removed; the sweep at the next start will: ${String(error)}`,
        );
      }
    }

    return true;
  }
}
