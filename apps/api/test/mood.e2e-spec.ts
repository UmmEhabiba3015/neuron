import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import {
  authenticate,
  closeTestDataSource,
  createTestDataSource,
} from './test-database';

describe('mood (e2e)', () => {
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
    await app.init();

    alice = await authenticate(app.getHttpServer(), 'alice');
    bob = await authenticate(app.getHttpServer(), 'bob');
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  const setMood = (auth: string, date: string, mood: string | null) =>
    request(app.getHttpServer())
      .put(`/days/${date}/mood`)
      .set('Authorization', auth)
      .send({ mood });

  it('sets a mood and reads it back', async () => {
    await setMood(alice, '2026-08-09', 'Even').expect(200);

    const read = await request(app.getHttpServer())
      .get('/days/2026-08-09')
      .set('Authorization', alice)
      .expect(200);

    expect(read.body).toEqual({ date: '2026-08-09', mood: 'Even' });
  });

  it('replaces a mood rather than adding a second one', async () => {
    await setMood(alice, '2026-08-09', 'Hard').expect(200);
    await setMood(alice, '2026-08-09', 'Good').expect(200);

    const rows = await dataSource.query<{ c: number }[]>(
      'SELECT COUNT(*) AS c FROM days',
    );
    expect(Number(rows[0].c)).toBe(1);

    const read = await request(app.getHttpServer())
      .get('/days/2026-08-09')
      .set('Authorization', alice);
    expect((read.body as { mood: string }).mood).toBe('Good');
  });

  it('clears a mood with null', async () => {
    await setMood(alice, '2026-08-09', 'Low').expect(200);
    await setMood(alice, '2026-08-09', null).expect(200);

    const read = await request(app.getHttpServer())
      .get('/days/2026-08-09')
      .set('Authorization', alice);
    expect((read.body as { mood: null }).mood).toBeNull();
  });

  it('refuses a mood that is not one of the five', async () => {
    const bad = await setMood(alice, '2026-08-09', 'Ecstatic').expect(400);
    expect(JSON.stringify(bad.body)).toContain('Hard');
  });

  it('refuses a number', async () => {
    await request(app.getHttpServer())
      .put('/days/2026-08-09/mood')
      .set('Authorization', alice)
      .send({ mood: 7 })
      .expect(400);
  });

  it('refuses a date that is the right shape but not a date', async () => {
    await setMood(alice, '2026-02-31', 'Even').expect(400);
    await setMood(alice, '2026-13-01', 'Even').expect(400);
    await setMood(alice, 'not-a-date', 'Even').expect(400);
  });

  /*
   * A day nobody has written to is not a 404. It is a real day with nothing
   * on it, and the screen for it has to render. Same rule as ADR-005's empty
   * collection: an empty answer is a complete answer.
   */
  it('answers for a day that has never been touched', async () => {
    const read = await request(app.getHttpServer())
      .get('/days/2020-01-01')
      .set('Authorization', alice)
      .expect(200);

    expect(read.body).toEqual({ date: '2020-01-01', mood: null });
  });

  it("does not show one user's mood to another", async () => {
    await setMood(alice, '2026-08-09', 'Hard').expect(200);

    const read = await request(app.getHttpServer())
      .get('/days/2026-08-09')
      .set('Authorization', bob)
      .expect(200);

    expect((read.body as { mood: null }).mood).toBeNull();
  });

  it("does not let one user overwrite another's mood", async () => {
    await setMood(alice, '2026-08-09', 'Hard').expect(200);
    await setMood(bob, '2026-08-09', 'Light').expect(200);

    const aliceRead = await request(app.getHttpServer())
      .get('/days/2026-08-09')
      .set('Authorization', alice);
    expect((aliceRead.body as { mood: string }).mood).toBe('Hard');
  });

  it('never leaks the owner or the row id', async () => {
    await setMood(alice, '2026-08-09', 'Even');
    const read = await request(app.getHttpServer())
      .get('/days/2026-08-09')
      .set('Authorization', alice);

    expect(Object.keys(read.body as object).sort()).toEqual(['date', 'mood']);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/days/2026-08-09').expect(401);
    await request(app.getHttpServer())
      .put('/days/2026-08-09/mood')
      .send({ mood: 'Even' })
      .expect(401);
  });
});
