import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { WireAuthenticated, WireUser } from '@neuron/contracts';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './login.dto';
import {
  REFRESH_COOKIE_CLEAR_OPTIONS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  packRefreshCookie,
  unpackRefreshCookie,
} from './refresh-cookie';
import { RegisterDto } from './register.dto';
import type { AuthenticatedRequest } from './authenticated-request';
import type { AuthenticatedSession } from './auth.service';
import type { Session } from './session.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<WireUser> {
    const user = await this.usersService.register(dto.email, dto.password);

    if (!user) {
      throw new ConflictException('That email address is already registered');
    }

    return user;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WireAuthenticated> {
    const session = await this.authService.login(dto.email, dto.password);

    if (!session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.respondWith(session, response);
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest): WireUser {
    return request.user;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<WireAuthenticated> {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const credential = unpackRefreshCookie(cookies?.[REFRESH_COOKIE_NAME]);

    const session = credential
      ? await this.authService.refresh(
          credential.sessionId,
          credential.refreshToken,
        )
      : undefined;

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return this.respondWith(session, response);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(request.session.id);

    response.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);
  }

  @Post('logout-everywhere')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutEverywhere(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutEverywhere(request.user.id);

    response.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);
  }

  @Get('sessions')
  listSessions(@Req() request: AuthenticatedRequest): Promise<Session[]> {
    return this.authService.listSessions(request.user.id);
  }

  /*
   * The refresh credential leaves in the cookie and only in the cookie. The
   * body is built field by field so that it cannot follow the service's
   * result into the response.
   */
  private respondWith(
    session: AuthenticatedSession,
    response: Response,
  ): WireAuthenticated {
    response.cookie(
      REFRESH_COOKIE_NAME,
      packRefreshCookie(session),
      REFRESH_COOKIE_OPTIONS,
    );

    return { accessToken: session.accessToken, user: session.user };
  }
}
