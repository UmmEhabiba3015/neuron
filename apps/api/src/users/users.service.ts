import { Injectable } from '@nestjs/common';
import type { Register } from '@neuron/contracts';
import { QueryFailedError } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { PasswordService } from '../auth/password.service';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  /*
   * The name and the timezone are stored as they arrive. RegisterDto has
   * already trimmed the one and resolved the other.
   */
  async register(registration: Register): Promise<UserEntity | undefined> {
    if (await this.usersRepository.findByEmail(registration.email)) {
      return undefined;
    }

    const user = new UserEntity();

    user.id = randomUUID();
    user.email = registration.email;
    user.name = registration.name;
    user.timezone = registration.timezone;
    user.createdAt = new Date().toISOString();
    user.passwordHash = await this.passwordService.hash(registration.password);

    try {
      await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (isUniqueNameViolation(error)) {
        return undefined;
      }

      throw error;
    }

    return user;
  }

  findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UserEntity | undefined> {
    return this.usersRepository.findById(id);
  }

  /*
   * The timezone arrives resolved, as UpdateTimezoneDto leaves it. Only the
   * timezone changes: entries and days keep the dates they were filed on
   * (docs/features.md, Ref 7). The answer is the user as now stored.
   */
  async setTimezone(
    id: string,
    timezone: string,
  ): Promise<UserEntity | undefined> {
    await this.usersRepository.updateTimezone(id, timezone);

    return this.usersRepository.findById(id);
  }

  /*
   * Takes a hash and not a password, so that the slow hashing can be done
   * before a transaction opens rather than while it is open. The caller
   * hashes with PasswordService, as register() does.
   */
  setPasswordHash(id: string, passwordHash: string): Promise<void> {
    return this.usersRepository.updatePasswordHash(id, passwordHash);
  }
}

function isUniqueNameViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    typeof (error.driverError as { code?: unknown }).code === 'string' &&
    (error.driverError as { code: string }).code.startsWith(
      'SQLITE_CONSTRAINT_UNIQUE',
    )
  );
}
