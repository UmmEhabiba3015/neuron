import {
  ClassSerializerInterceptor,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { validate } from './config/env.validation';
import { EntriesModule } from './entries/entries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Node already loads `.env` via `--env-file-if-exists`. Turning this on
      // would point a second parser at the same file, with different quoting
      // rules and no way to tell which one produced a surprising value.
      ignoreEnvFile: true,
      validate,
    }),
    EntriesModule,
    AuthModule,
  ],
  // Registered here rather than via `app.useGlobalPipes()` in `main.ts`:
  // nothing imports `main.ts`, so a pipe attached there is absent from every
  // test and the suite would end up asserting against a pipe it built itself.
  providers: [
    // What enforces `@Exclude()` on `User.passwordHash`. Without this the
    // decorator is inert metadata and a credential goes out in the
    // registration response — `@Exclude()` describes the intent, this makes it
    // happen, and neither is any use alone.
    //
    // Registered here rather than in `main.ts` for the reason the pipe below
    // already gives: nothing imports `main.ts`, so an interceptor attached
    // there would be absent from every test.
    //
    // Its limit, stated where it is switched on: it transforms class
    // *instances*. A plain object — from `ds.query()`, `getRawMany()`, or a
    // hand-built literal — passes through untouched, so a controller returning
    // one is unprotected. That is why the guarantee is pinned by a test on
    // response bodies (`test/auth.e2e-spec.ts`) rather than by this line.
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // A pair. `whitelist` alone silently drops unknown fields; with
        // `forbidNonWhitelisted` a body containing `contnet` is rejected
        // instead (ADR-006).
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
