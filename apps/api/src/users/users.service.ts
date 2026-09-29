import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { PasswordService } from '../auth/password.service';
import { User } from './user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async register(email: string, password: string): Promise<User | undefined> {
    if (await this.usersRepository.findByEmail(email)) {
      return undefined;
    }

    const user = new User();

    user.id = randomUUID();
    user.email = email;
    user.createdAt = new Date().toISOString();
    user.passwordHash = await this.passwordService.hash(password);

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

  findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findById(id);
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
