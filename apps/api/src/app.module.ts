import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
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
  ],
  // Registered here rather than via `app.useGlobalPipes()` in `main.ts`:
  // nothing imports `main.ts`, so a pipe attached there is absent from every
  // test and the suite would end up asserting against a pipe it built itself.
  providers: [
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
