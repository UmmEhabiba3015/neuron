import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { EnvironmentVariables } from '../config/env.validation';
import { DatabaseModule } from '../database/database.module';
import { AudioModule } from '../entries/audio.module';
import { MailModule } from '../shared/mail/mail.module';
import { UserEntity } from '../users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AccountDeletionService } from './account-deletion.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordService } from './password.service';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetsRepository } from './password-resets.repository';
import { RefreshTokenService } from './refresh-token.service';
import { SessionEntity } from './entities/session.entity';
import { SessionsRepository } from './sessions.repository';
import { TokenService } from './token.service';

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    AudioModule,
    TypeOrmModule.forFeature([UserEntity, SessionEntity, PasswordResetEntity]),

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
    PasswordResetsRepository,
    PasswordResetService,
    AuthService,
    AccountDeletionService,
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
