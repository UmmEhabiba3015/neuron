import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

// Hashing, isolated behind one class so that the choice of algorithm is one
// import and two methods rather than a call site in every service that touches
// a credential. ADR-011 records why argon2id.
//
// The defaults are argon2's own — `m=65536` (64 MiB), `t=3`, `p=4` — and they
// are not restated here on purpose. Pinning them in code would mean this file
// disagrees with the library the day either changes, and the parameters that
// actually matter are the ones recorded inside each stored hash.
@Injectable()
export class PasswordService {
  // ~60ms on the development machine, and that cost is the point rather than a
  // regrettable side effect. A stolen database is attacked offline, where rate
  // limits and lockouts do not exist, so the only thing between an attacker and
  // the passwords is what each guess costs. Measured on this laptop: SHA-256
  // runs at ~578,000 guesses/second, argon2id at ~30.
  hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  // The salt and parameters are read back out of `storedHash` itself, which is
  // why the PHC string is stored whole (see `user.entity.ts`).
  //
  // Returns false rather than throwing on a malformed stored hash. A corrupted
  // row is a failed login, not a 500 that tells the caller something
  // interesting about the state of the database.
  async verify(storedHash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(storedHash, password);
    } catch {
      return false;
    }
  }
}
