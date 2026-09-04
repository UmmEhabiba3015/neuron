import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  // Must stay a number. `listen` reads a string as a filesystem path, so
  // `PORT=hello` would start a healthy server on a socket file (ADR-007).
  await app.listen(config.get('PORT', { infer: true }));
}

bootstrap().catch((error: unknown) => {
  console.error('Neuron API failed to start:', error);
  process.exit(1);
});
