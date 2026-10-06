import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureHttp } from './configure-http';
import type { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureHttp(app);

  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  await app.listen(config.get('PORT', { infer: true }));
}

bootstrap().catch((error: unknown) => {
  console.error('Neuron API failed to start:', error);
  process.exit(1);
});
