import { Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { PasswordService } from '../auth/password.service';
import { User } from './user.entity';
import { UsersRepository } from './users.repository';

// Application logic: no SQL, no TypeORM types, no request shapes, no status
// codes (ADR-005, ADR-010).
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  // Returns `undefined` when the name is taken, rather than throwing. "That
  // name exists" is an ordinary outcome of trying to register, and whether it
  // deserves a 409 is a question about HTTP that this layer may not answer
  // (ADR-005). The controller makes that translation and nothing else does.
  async register(name: string, password: string): Promise<User | undefined> {
    // A read followed by a write, which is a race by construction: two requests
    // can both find nothing here and both go on to insert. **This check is an
    // optimisation, not the guard** — it produces a clean answer on the
    // ordinary path and avoids hashing a password that is about to be thrown
    // away. The guard is the unique index on `users.name`, and the `catch`
    // below is what keeps the loser of the race from getting a 500.
    if (await this.usersRepository.findByName(name)) {
      return undefined;
    }

    const user = new User();

    // Generated here, not in the repository, for the reason ADR-004 gives about
    // `id` and `createdAt` on entries: neither `randomUUID()` nor `new Date()`
    // touches the database, so putting them behind the storage boundary would
    // weaken it without buying anything.
    user.id = randomUUID();
    user.name = name;
    user.createdAt = new Date().toISOString();
    user.passwordHash = await this.passwordService.hash(password);

    try {
      await this.usersRepository.save(user);
    } catch (error: unknown) {
      // The other half of the race. Narrowed to the unique-constraint failure
      // on purpose: a bare `catch` here would swallow a disk error, a closed
      // connection or a schema mismatch and report all of them to the caller as
      // "that name is taken", which is a lie that would be very hard to debug.
      if (isUniqueNameViolation(error)) {
        return undefined;
      }

      throw error;
    }

    return user;
  }

  findByName(name: string): Promise<User | undefined> {
    return this.usersRepository.findByName(name);
  }

  findById(id: string): Promise<User | undefined> {
    return this.usersRepository.findById(id);
  }
}

// SQLite reports a unique-index violation as `SQLITE_CONSTRAINT_UNIQUE`, which
// TypeORM wraps in a `QueryFailedError`. Both halves are checked: the wrapper
// says the failure came from the database rather than from application code,
// and the driver code says which failure it was.
//
// The driver-specific string is the reason this function is here rather than
// inline — Day 24 swaps `better-sqlite3` for `pg`, whose code for the same
// condition is `23505`, and this is the one place that has to change.
function isUniqueNameViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    typeof (error.driverError as { code?: unknown }).code === 'string' &&
    (error.driverError as { code: string }).code.startsWith(
      'SQLITE_CONSTRAINT_UNIQUE',
    )
  );
}
