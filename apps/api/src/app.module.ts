import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
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
  // The pipe every request passes through before any controller method sees
  // it. Registering it here rather than with `app.useGlobalPipes()` in
  // `main.ts` is the decision, and the reason is what the tests can see.
  //
  // Nothing in this repository imports `main.ts` — the grep returns nothing —
  // and every test builds the application straight from this module. A pipe
  // attached in `main.ts` would therefore be absent from the whole end-to-end
  // suite. The loud consequence is harmless: those tests assert 400s, so they
  // would go red immediately. The dangerous one is the repair somebody would
  // then reach for — configuring a pipe in the test setup — because from that
  // moment the suite asserts against a pipe *the test* built. Changing an
  // option here would leave every test green while the real API changed
  // behaviour: two descriptions of one application, free to drift.
  //
  // `APP_PIPE` puts the pipe in the module graph instead, so there is one
  // description and everything that builds `AppModule` gets it — production,
  // the end-to-end suite, and the config-wiring spec (ADR-008).
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // Strip properties with no validation rules... except that
        // `forbidNonWhitelisted` upgrades "strip" to "refuse", which is the
        // behaviour ADR-006 decided: a body containing `contnet` is a typo the
        // sender needs told about, not a field to quietly discard. The two
        // options are a pair; `whitelist` alone would silently drop it.
        whitelist: true,
        forbidNonWhitelisted: true,
        // Hand the controller a real instance of the declared class rather than
        // the plain object that arrived. This is the option that makes
        // `@Body() dto: CreateEntryDto` true instead of merely written down —
        // without it the parameter holds an object wearing a class's name,
        // which is a quieter version of the lie `unknown` was chosen to avoid
        // (ADR-008).
        //
        // It converts nothing here and must not: `class-transformer` copies
        // values across untouched unless a `@Transform` or `@Type` asks it not
        // to, and neither appears in any DTO. Content reaches storage exactly
        // as it was sent, spacing included — pinned by a test.
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
