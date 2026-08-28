import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { EntriesModule } from './entries/entries.module';

// The root module. It doesn't do anything itself — it just assembles the
// feature modules that make up the app. As the app grows, new features get
// their own module and get listed here, rather than everything living in one
// giant file.
@Module({
  imports: [
    ConfigModule.forRoot({
      // Registered globally so that anything needing configuration simply asks
      // for `ConfigService`, instead of every feature module having to import
      // this one. Configuration stops being a global that any file can reach
      // into and becomes a dependency handed to whoever needs it — the same
      // thing the DATABASE token already does, which is what lets the
      // end-to-end suite swap the database out from underneath the app.
      isGlobal: true,
      // Node loads `.env` itself, through `--env-file-if-exists` in the start
      // scripts. Leaving this false would point a second parser at the same
      // file — @nestjs/config bundles `dotenv` — which means one file, two sets
      // of quoting and escaping rules, and no way to tell which one produced a
      // surprising value.
      ignoreEnvFile: true,
      // Every rule lives in `validate`, and it runs here: once, at boot, before
      // any provider is constructed. @nestjs/config supplies the wiring and the
      // injectable service, and does no checking of its own — the checking is
      // hand-written on purpose rather than delegated to a schema library
      // (ADR-007).
      validate,
    }),
    EntriesModule,
  ],
})
export class AppModule {}
