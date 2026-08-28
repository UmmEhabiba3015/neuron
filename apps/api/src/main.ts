import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The port has already been checked — an unusable value stopped the boot
  // above, inside `NestFactory.create`, before this line was ever reached. What
  // arrives here is a number rather than the string the environment holds, and
  // that is the point: `listen` treats a number as a TCP port and a string as a
  // possible filesystem path, so passing the raw value through is how
  // `PORT=hello` used to start a healthy server listening on a socket file
  // called `hello` (ADR-007).
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  await app.listen(config.get('PORT', { infer: true }));
}

// `bootstrap()` is async, so calling it bare would hand the promise to nobody:
// if startup fails — port already in use, a provider that can't be resolved —
// the error surfaces as a raw unhandled rejection with no hint that it was
// *boot* that failed. Catching it means the process says what went wrong and
// exits non-zero, which is the only signal a process manager or CI job reads.
//
// A failed configuration check does *not* arrive here, which is worth knowing
// before someone goes looking for it. `NestFactory.create` runs the module
// graph inside its own exception zone, and with `abortOnError` left at its
// default that zone logs the error itself and calls `process.exit(1)` — so the
// message is printed and the exit code is right, but by Nest rather than by
// this handler.
bootstrap().catch((error: unknown) => {
  console.error('Neuron API failed to start:', error);
  process.exit(1);
});
