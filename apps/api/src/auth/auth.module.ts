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
import { TokenService } from './token.service';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    // `registerAsync` for the same reason `TypeOrmModule.forRootAsync` is
    // async: the secret comes from `ConfigService`, which does not exist until
    // the injector does. Nothing here reads `process.env` (ADR-007).
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          // One hour. ADR-009 recorded the objection that makes this the only
          // real mitigation available today: a signed token carries its own
          // authority, so there is no server-side state to delete and logging
          // out cannot invalidate one. Expiry is the whole of revocation until
          // Day 11 adds refresh tokens, and an hour is the window in which a
          // stolen token is usable.
          expiresIn: '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  // `UsersRepository` is deliberately not exported, on the same terms as
  // `EntriesRepository`: nothing outside this module reaches past the service
  // to the database. `UsersService` is exported because Day 10's ownership
  // checks need to resolve a caller to a user.
  providers: [
    UsersService,
    UsersRepository,
    PasswordService,
    TokenService,
    AuthService,
    JwtAuthGuard,
  ],
  // `TokenService` is exported because Day 10's guard verifies tokens, and
  // `UsersService` because resolving `sub` to a user is what turns a verified
  // token into a caller.
  // `JwtAuthGuard` is exported because `EntriesModule` puts it on its routes.
  // Exporting the guard rather than re-declaring it keeps one definition of
  // what an authenticated request means.
  exports: [UsersService, PasswordService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
