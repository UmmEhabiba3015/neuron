import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

// The only class permitted to know how users are stored, on the same terms as
// `EntriesRepository` (ADR-004, ADR-010):
//
//   It may know:      the TypeORM connection, the `users` table, its columns.
//   It must not know: anything about HTTP, and anything about hashing. A hash
//                     is a fact about credentials, not about storage; this file
//                     writes whatever string it is handed.
//   What crosses:     User objects out, plain values in. TypeORM's own
//                     `Repository` never leaves this file.
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // `insert`, not `save`, for the reason `EntriesRepository.save` gives:
  // TypeORM's `save()` reads first and turns an existing id into an UPDATE, so
  // a duplicate id would quietly overwrite an existing account rather than
  // failing.
  async save(user: User): Promise<void> {
    await this.users.insert(user);
  }

  // `addSelect` is not needed for `passwordHash`: `@Exclude()` governs
  // serialisation, not selection, so the column is in every SELECT already.
  // That is deliberate — login has to read it — and it is exactly why the
  // response-body test exists rather than a trust in the column being absent.
  async findByName(name: string): Promise<User | undefined> {
    return (await this.users.findOneBy({ name })) ?? undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    return (await this.users.findOneBy({ id })) ?? undefined;
  }
}
