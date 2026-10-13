import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureHttp } from '../../src/shared/utils/configure-http';
import { closeTestDataSource, createTestDataSource } from './test-database';

export interface RunningApp {
  app: INestApplication<App>;
  dataSource: DataSource;
  server: App;
}

/*
 * The whole application, as main.ts builds it, on a fresh in-memory database
 * that has every migration applied. Every suite that talks HTTP starts here,
 * so a new piece of wiring is added once.
 */
export async function startApp(): Promise<RunningApp> {
  const dataSource = await createTestDataSource();

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(getDataSourceToken())
    .useValue(dataSource)
    .compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureHttp(app);
  await app.init();

  return { app, dataSource, server: app.getHttpServer() };
}

export async function stopApp(running: RunningApp | undefined): Promise<void> {
  if (running === undefined) {
    return;
  }

  await running.app.close();
  await closeTestDataSource(running.dataSource);
}

/*
 * Requests made as one signed-in person. The access token is the value of the
 * Authorization header, as authenticate() and login() return it.
 */
export function as(server: App, authorization: string) {
  const agent = request(server);

  return {
    get: (url: string) => agent.get(url).set('Authorization', authorization),
    post: (url: string) => agent.post(url).set('Authorization', authorization),
    put: (url: string) => agent.put(url).set('Authorization', authorization),
    patch: (url: string) =>
      agent.patch(url).set('Authorization', authorization),
    delete: (url: string) =>
      agent.delete(url).set('Authorization', authorization),
  };
}

export type Caller = ReturnType<typeof as>;

export const messagesFrom = (response: request.Response): string[] =>
  (response.body as { message: string[] }).message;
