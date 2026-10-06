import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import {
  authenticate,
  closeTestDataSource,
  createTestDataSource,
} from './test-database';

describe('days in a range (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;
  let bob: string;

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    configureHttp(app);
    await app.init();

    alice = await authenticate(app.getHttpServer(), 'alice');
    bob = await authenticate(app.getHttpServer(), 'bob');

    for (const [date, mood] of [
      ['2026-07-31', 'Low'],
      ['2026-08-01', 'Even'],
      ['2026-08-15', 'Good'],
      ['2026-08-31', 'Hard'],
      ['2026-09-01', 'Light'],
    ] as const) {
      await request(app.getHttpServer())
        .put(`/days/${date}/mood`)
        .set('Authorization', alice)
        .send({ mood })
        .expect(200);
    }
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  const range = (auth: string, from: string, to: string) =>
    request(app.getHttpServer())
      .get(`/days?from=${from}&to=${to}`)
      .set('Authorization', auth);

  it('returns the days inside the range, newest first', async () => {
    const august = await range(alice, '2026-08-01', '2026-08-31').expect(200);

    expect((august.body as { date: string }[]).map((d) => d.date)).toEqual([
      '2026-08-31',
      '2026-08-15',
      '2026-08-01',
    ]);
  });

  it('includes both ends of the range', async () => {
    const one = await range(alice, '2026-08-01', '2026-08-01').expect(200);
    expect(one.body).toHaveLength(1);
  });

  it('returns an empty array for a range with nothing in it', async () => {
    const none = await range(alice, '2025-01-01', '2025-12-31').expect(200);
    expect(none.body).toEqual([]);
  });

  it("does not return another user's days", async () => {
    const bobs = await range(bob, '2026-01-01', '2026-12-31').expect(200);
    expect(bobs.body).toEqual([]);
  });

  it('carries the mood, so the calendar can mark a day without a second request', async () => {
    const august = await range(alice, '2026-08-01', '2026-08-31');
    expect((august.body as { date: string; mood: string }[])[0]).toEqual({
      date: '2026-08-31',
      mood: 'Hard',
    });
  });

  it('refuses a range whose dates are not dates', async () => {
    await range(alice, '2026-02-31', '2026-03-01').expect(400);
    await range(alice, 'nope', '2026-03-01').expect(400);
  });

  it('requires both ends', async () => {
    await request(app.getHttpServer())
      .get('/days?from=2026-08-01')
      .set('Authorization', alice)
      .expect(400);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .get('/days?from=2026-08-01&to=2026-08-31')
      .expect(401);
  });
});
