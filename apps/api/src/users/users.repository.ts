import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async save(user: User): Promise<void> {
    await this.users.insert(user);
  }

  /*
   * Matched case-insensitively, because the unique index is on lower(email)
   * and a lookup that disagreed with it would let someone register an
   * address that already exists and then fail to sign in with it.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return (
      (await this.users
        .createQueryBuilder('user')
        .where('lower(user.email) = lower(:email)', { email })
        .addSelect('user.passwordHash')
        .getOne()) ?? undefined
    );
  }

  async findById(id: string): Promise<User | undefined> {
    return (await this.users.findOneBy({ id })) ?? undefined;
  }
}
