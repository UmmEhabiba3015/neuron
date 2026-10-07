import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import { dayFor } from './../src/days/day-boundary';
import { freezeClockAt, moveClockTo, releaseClock } from './clock';
import {
  authenticate,
  closeTestDataSource,
  createTestDataSource,
  login,
  SEEDED_TIMEZONE,
} from './test-database';

/*
 * The clock is set in every test. A suite that read the real one would pass
 * or fail depending on the hour it ran.
 */
describe('today (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const todayAt = async (who: string, instant: string) => {
    moveClockTo(instant);

    return request(app.getHttpServer())
      .get('/days/today')
      .set('Authorization', await login(app.getHttpServer(), who));
  };

  beforeEach(async () => {
    freezeClockAt('2026-08-09T12:00:00.000Z');

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

    await authenticate(app.getHttpServer(), 'alice');
    await authenticate(app.getHttpServer(), 'bob');
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  it('is reachable, and is not taken for a date', async () => {
    const response = await todayAt('alice', '2026-08-09T12:00:00.000Z');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ date: '2026-08-09', mood: null });
  });

  /*
   * Alice is in UTC, so her day ends at 00:00Z. The expected date is written
   * out and also asked of dayFor, so the test fails if the endpoint stops
   * using the rule and also if somebody changes the rule without meaning to
   * change this.
   */
  it.each([
    ['an ordinary afternoon', '2026-08-09T15:00:00.000Z', '2026-08-09'],
    ['just before midnight', '2026-08-08T23:59:59.999Z', '2026-08-08'],
    ['midnight exactly', '2026-08-09T00:00:00.000Z', '2026-08-09'],
    ['just after midnight', '2026-08-09T00:00:01.000Z', '2026-08-09'],
    [
      '04:00, which used to be the boundary',
      '2026-08-09T03:59:59.999Z',
      '2026-08-09',
    ],
    ['the small hours of new year', '2027-01-01T02:00:00.000Z', '2027-01-01'],
  ])('at %s, today is the date dayFor gives', async (_label, instant, date) => {
    const response = await todayAt('alice', instant);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ date, mood: null });
    expect((response.body as { date: string }).date).toBe(
      dayFor(instant, SEEDED_TIMEZONE),
    );
  });

  it('carries the mood of today once one is set', async () => {
    moveClockTo('2026-08-09T23:30:00.000Z');
    const alice = await login(app.getHttpServer(), 'alice');

    await request(app.getHttpServer())
      .put('/days/2026-08-09/mood')
      .set('Authorization', alice)
      .send({ mood: 'Good' })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/days/today')
      .set('Authorization', alice)
      .expect(200);

    expect(response.body).toEqual({ date: '2026-08-09', mood: 'Good' });
  });

  it("does not show another user's mood for the same date", async () => {
    await request(app.getHttpServer())
      .put('/days/2026-08-09/mood')
      .set('Authorization', await login(app.getHttpServer(), 'bob'))
      .send({ mood: 'Hard' })
      .expect(200);

    const response = await todayAt('alice', '2026-08-09T12:00:00.000Z');

    expect(response.body).toEqual({ date: '2026-08-09', mood: null });
  });

  /*
   * "An empty day does not exist." Looking at today must not be what makes
   * it exist, or opening the app every morning would mark the calendar.
   */
  it('does not create a day by being asked', async () => {
    await todayAt('alice', '2026-08-09T12:00:00.000Z');
    await todayAt('alice', '2026-08-09T12:00:00.000Z');

    const rows = await dataSource.query<{ c: number }[]>(
      'SELECT COUNT(*) AS c FROM days',
    );
    expect(Number(rows[0].c)).toBe(0);
  });

  it.each([['2026-08-08T23:59:00.000Z'], ['2026-08-09T00:01:00.000Z']])(
    'names the date an entry written at %s is filed under',
    async (instant) => {
      moveClockTo(instant);
      const alice = await login(app.getHttpServer(), 'alice');

      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', alice)
        .send({ content: 'written just now' })
        .expect(201);

      const today = await request(app.getHttpServer())
        .get('/days/today')
        .set('Authorization', alice)
        .expect(200);

      const { date } = today.body as { date: string };

      const entries = await request(app.getHttpServer())
        .get(`/entries?date=${date}`)
        .set('Authorization', alice)
        .expect(200);

      expect(entries.body).toHaveLength(1);
    },
  );

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/days/today').expect(401);
  });
});
