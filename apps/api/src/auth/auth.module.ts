import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { EnvironmentVariables } from '../config/env.validation';
import { DatabaseModule } from '../database/database.module';
import { User } from '../users/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { Session } from './session.entity';
import { SessionsRepository } from './sessions.repository';
import { TokenService } from './token.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, Session]),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],

  providers: [
    UsersService,
    UsersRepository,
    PasswordService,
    TokenService,
    RefreshTokenService,
    SessionsRepository,
    AuthService,
    JwtAuthGuard,
  ],

  exports: [
    UsersService,
    PasswordService,
    TokenService,
    SessionsRepository,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
