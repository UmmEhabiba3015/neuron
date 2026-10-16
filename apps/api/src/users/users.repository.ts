import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async save(user: UserEntity): Promise<void> {
    await this.users.insert(user);
  }

  /*
   * Matched case-insensitively, because the unique index is on lower(email)
   * and a lookup that disagreed with it would let someone register an
   * address that already exists and then fail to sign in with it.
   */
  async findByEmail(email: string): Promise<UserEntity | undefined> {
    return (
      (await this.users
        .createQueryBuilder('user')
        .where('lower(user.email) = lower(:email)', { email })
        .addSelect('user.passwordHash')
        .getOne()) ?? undefined
    );
  }

  async findById(id: string): Promise<UserEntity | undefined> {
    return (await this.users.findOneBy({ id })) ?? undefined;
  }

  async updateTimezone(id: string, timezone: string): Promise<void> {
    await this.users.update({ id }, { timezone });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.users.update({ id }, { passwordHash });
  }
}
