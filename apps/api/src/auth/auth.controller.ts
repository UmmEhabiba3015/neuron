import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import type { AuthenticatedRequest } from './authenticated-request';
import type { AuthenticatedSession } from './auth.service';
import type { User } from '../users/user.entity';

// HTTP only: routes, status codes and response shapes (ADR-005).
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  // 201 by Nest's default for POST, which is correct here: a successful
  // registration creates a user.
  //
  // Returns the `User` entity rather than a hand-built object, and that is
  // load-bearing rather than lazy. `@Exclude()` on `passwordHash` is enforced
  // by `ClassSerializerInterceptor` (registered in `app.module.ts`), and the
  // interceptor only acts on class *instances*. Returning a literal here would
  // work today and would be the thing a future endpoint copies, so the entity
  // goes out and the decorator does its job.
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<User> {
    const user = await this.usersService.register(dto.name, dto.password);

    // The translation the layers below refuse to make: `undefined` becomes a
    // status code here and nowhere else (ADR-005).
    //
    // 409 rather than 400: the body is perfectly well-formed, and what failed
    // is a conflict with state that already exists.
    //
    // This does leak that a name is registered, which is a real trade and is
    // made deliberately. The alternative — a generic success that quietly does
    // not create an account — is worse: it makes registration untestable by the
    // person using it, and any attacker can discover the same fact by
    // attempting to register anyway. Login is the endpoint where this reasoning
    // reverses, and Block 5 says why.
    if (!user) {
      throw new ConflictException('That name is already taken');
    }

    return user;
  }

  // 200, not 201. Nest defaults POST to 201 Created, and logging in creates no
  // resource — the token is a statement about an account that already exists.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthenticatedSession> {
    const session = await this.authService.login(dto.name, dto.password);

    // **One message for every way this can fail**, and the single most
    // important line in this file. No such name, no password set, wrong
    // password: one 401, one string, one shape. Distinguishing them would be a
    // user-enumeration oracle — see `auth.service.ts` for why that is worse
    // here than in most applications.
    //
    // This is also where registration's reasoning reverses. `/auth/register`
    // says "that name is already taken" because the caller needs to know to
    // pick another, and anyone can learn the same fact by attempting to
    // register. Login is reachable with a list of names and no intent to
    // create anything, so the same honesty becomes a free membership check.
    if (!session) {
      throw new UnauthorizedException('Invalid name or password');
    }

    return session;
  }

  // The endpoint that proves the day's claim: the server can name its caller.
  // Everything before this issued or checked credentials; this is the first
  // route whose *answer* depends on who is asking.
  //
  // It does no work of its own, and that is the point — by the time the handler
  // runs, `JwtAuthGuard` has verified the token and loaded the user, so naming
  // the caller is a property read. The guard is where the identity comes from,
  // and this returns it.
  //
  // `@Exclude()` keeps the credential out of the body here exactly as it does
  // on register, which is what makes returning the entity safe rather than
  // convenient.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest): User {
    return request.user;
  }
}
