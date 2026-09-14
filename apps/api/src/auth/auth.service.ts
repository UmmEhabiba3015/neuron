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

  async login(
    name: string,
    password: string,
  ): Promise<AuthenticatedSession | undefined> {
    const user = await this.usersService.findByName(name);

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

const UNKNOWN_USER_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$soIwesaY19HtJeFNdUXeeQ$FSgzNZ7zyOFVvqDyK5PWYK/9ogzD3OWRJxKOKrL5Ru4';
