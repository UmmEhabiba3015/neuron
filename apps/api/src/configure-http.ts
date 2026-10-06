import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import type { EnvironmentVariables } from './config/env.validation';

/*
 * Everything that prepares the application for HTTP, in one place.
 *
 * `main.ts` is not executed by the end-to-end suite, so anything configured
 * only there is something no test can see. `main.ts` and the end-to-end tests
 * both call this instead.
 */
export function configureHttp(app: INestApplication): void {
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.use(cookieParser());

  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  });
}
