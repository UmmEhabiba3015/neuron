import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}

// `bootstrap()` is async, so calling it bare would hand the promise to nobody:
// if startup fails — port already in use, a provider that can't be resolved —
// the error surfaces as a raw unhandled rejection with no hint that it was
// *boot* that failed. Catching it means the process says what went wrong and
// exits non-zero, which is the only signal a process manager or CI job reads.
bootstrap().catch((error: unknown) => {
  console.error('Neuron API failed to start:', error);
  process.exit(1);
});
