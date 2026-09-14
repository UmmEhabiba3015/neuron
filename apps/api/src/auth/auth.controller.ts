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
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import type { AuthenticatedRequest } from './authenticated-request';
import type { AuthenticatedSession } from './auth.service';
import type { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<User> {
    const user = await this.usersService.register(dto.name, dto.password);

    if (!user) {
      throw new ConflictException('That name is already taken');
    }

    return user;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthenticatedSession> {
    const session = await this.authService.login(dto.name, dto.password);

    if (!session) {
      throw new UnauthorizedException('Invalid name or password');
    }

    return session;
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest): User {
    return request.user;
  }
}
