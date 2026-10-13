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
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import {
  REFRESH_COOKIE_CLEAR_OPTIONS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  packRefreshCookie,
  unpackRefreshCookie,
} from './refresh-cookie';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import type { AuthenticatedRequest } from '../shared/types/authenticated-request.interface';
import type { AuthenticatedSession } from './types/authenticated-session.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.usersService.register(dto);

    if (!user) {
      throw new ConflictException('That email address is already registered');
    }

    return new UserResponseDto(user);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.login(dto.email, dto.password);

    if (!session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.respondWith(session, response);
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest): UserResponseDto {
    return new UserResponseDto(request.user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
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
  async listSessions(
    @Req() request: AuthenticatedRequest,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.authService.listSessions(request.user.id);

    return sessions.map((session) => new SessionResponseDto(session));
  }

  /*
   * The refresh credential leaves in the cookie and only in the cookie. The
   * body is AuthResponseDto, built field by field, so that it cannot follow
   * the service's result into the response.
   */
  private respondWith(
    session: AuthenticatedSession,
    response: Response,
  ): AuthResponseDto {
    response.cookie(
      REFRESH_COOKIE_NAME,
      packRefreshCookie(session),
      REFRESH_COOKIE_OPTIONS,
    );

    return new AuthResponseDto(session);
  }
}
