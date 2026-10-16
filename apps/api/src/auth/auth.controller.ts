import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset.service';
import { RegisterDto } from './dto/register.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { UpdateTimezoneDto } from './dto/update-timezone.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import type { AuthenticatedRequest } from '../shared/types/authenticated-request.interface';
import type { AuthenticatedSession } from './types/authenticated-session.interface';

/*
 * One answer for a reset link that is unknown, expired or already used, so
 * that none of the three can be told from the others.
 */
export const INVALID_RESET_LINK =
  'This reset link has expired or has already been used';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
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
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const session = await this.authService.login(
      dto.email,
      dto.password,
      request.headers['user-agent'],
    );

    if (!session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.respondWith(session, response);
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest): UserResponseDto {
    return new UserResponseDto(request.user);
  }

  /*
   * Changes the timezone, and nothing already written (docs/features.md,
   * Ref 7). The answer is the user as now stored, so the web app shows the
   * new timezone without asking again.
   */
  @Patch('me')
  async updateMe(
    @Body() dto: UpdateTimezoneDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.setTimezone(
      request.user.id,
      dto.timezone,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
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
    await this.authService.logout(request.user.id, request.session.id);

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

  /*
   * 204 whether or not an account uses the address, and before anything is
   * looked up, stored or sent, so neither the answer nor its timing says
   * which addresses have accounts (docs/features.md, Ref 4).
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto): void {
    this.passwordResetService.requestInBackground(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    if (!(await this.passwordResetService.reset(dto.token, dto.password))) {
      throw new BadRequestException(INVALID_RESET_LINK);
    }
  }

  @Get('sessions')
  async listSessions(
    @Req() request: AuthenticatedRequest,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.authService.listSessions(request.user.id);

    return sessions.map(
      (session) => new SessionResponseDto(session, request.session.id),
    );
  }

  /*
   * Signs out one device. Another person's session, one that does not
   * exist, and one that has already ended are all the same 404 (ADR-013).
   *
   * The session making the request may be the one named. Then this is
   * "Sign out of this device", and the cookie is cleared as logout clears
   * it.
   */
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async endSession(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (!(await this.authService.logout(request.user.id, id))) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    if (id === request.session.id) {
      response.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_CLEAR_OPTIONS);
    }
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
