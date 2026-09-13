import { Injectable } from '@nestjs/common';
import type { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

export interface AuthenticatedSession {
  accessToken: string;
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  // Returns `undefined` for every failure, without saying which one, and the
  // controller turns that into one 401 with one message.
  //
  // **Three different failures deliberately collapse into one outcome:** no
  // user by that name, a user with no password hash (registered before
  // credentials existed), and a wrong password. Telling them apart would be
  // better error reporting and a user-enumeration oracle — one request per
  // address from a breached list separates real accounts from guesses, turning
  // 100,000 addresses into a verified membership list without cracking
  // anything. For a private journal, membership is itself the sensitive fact:
  // that someone keeps a record of their inner life, confirmed for free, to
  // anyone who asks. Including someone who already knows them.
  async login(
    name: string,
    password: string,
  ): Promise<AuthenticatedSession | undefined> {
    const user = await this.usersService.findByName(name);

    // The dummy verify is the part that is easy to leave out and is half the
    // defence. Identical *messages* are not enough on their own: argon2 is
    // ~60ms of deliberate work, so returning early for an unknown name would
    // answer in about a millisecond while a wrong password took sixty. The
    // response time would then say exactly what the message refused to, and an
    // attacker reads a stopwatch as easily as a string.
    //
    // So an unknown name is charged the same work. The hash below is a real
    // argon2 hash of a value nothing can be, verified against the submitted
    // password so the comparison is genuinely performed rather than optimised
    // away.
    if (!user?.passwordHash) {
      await this.passwordService.verify(UNKNOWN_USER_HASH, password);

      return undefined;
    }

    if (!(await this.passwordService.verify(user.passwordHash, password))) {
      return undefined;
    }

    return { accessToken: await this.tokenService.sign(user), user };
  }
}

// A real argon2id hash, of a random value that was discarded. It exists only to
// give `verify` something well-formed to work on when there is no user, so that
// the failing path costs what the succeeding path costs.
//
// Hard-coded rather than computed at boot for two reasons: hashing at import
// would make every process start ~60ms slower for a value that never changes,
// and a constant is visible to a reader in a way a generated one is not. It is
// not a secret. Knowing it reveals nothing — there is no account it belongs to,
// and no password produces it.
const UNKNOWN_USER_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$soIwesaY19HtJeFNdUXeeQ$FSgzNZ7zyOFVvqDyK5PWYK/9ogzD3OWRJxKOKrL5Ru4';
