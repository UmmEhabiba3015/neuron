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

  async findByName(name: string): Promise<User | undefined> {
    return (await this.users.findOneBy({ name })) ?? undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    return (await this.users.findOneBy({ id })) ?? undefined;
  }
}
