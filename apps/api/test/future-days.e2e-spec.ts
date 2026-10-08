import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import { freezeClockAt, moveClockTo, releaseClock } from './clock';
import {
  authenticate,
  closeTestDataSource,
  createTestDataSource,
  login,
} from './test-database';

/*
 * A day that has not happened yet does not exist. Asking for it, or setting
 * a mood on it, is a 404. "Not happened yet" is judged in the timezone of
 * the person asking, so every test here sets the clock.
 */
describe('a day that has not happened yet (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  /*
   * Signs in after the clock has moved. An access token lasts fifteen
   * minutes, so one from before a jump is expired after it.
   */
  const at = async (instant: string, who: string) => {
    moveClockTo(instant);

    const authorization = await login(app.getHttpServer(), who);
    const server = app.getHttpServer();

    return {
      day: (date: string) =>
        request(server)
          .get(`/days/${date}`)
          .set('Authorization', authorization),
      setMood: (date: string, mood: unknown = 'Even') =>
        request(server)
          .put(`/days/${date}/mood`)
          .set('Authorization', authorization)
          .send({ mood }),
      get: (path: string) =>
        request(server).get(path).set('Authorization', authorization),
      write: (content: string) =>
        request(server)
          .post('/entries')
          .set('Authorization', authorization)
          .send({ content }),
    };
  };

  const dayRows = () =>
    dataSource.query<{ date: string; mood: string | null }[]>(
      `SELECT date, mood FROM days ORDER BY date`,
    );

  const notFound = (date: string) => ({
    message: `Day with date ${date} not found`,
    error: 'Not Found',
    statusCode: 404,
  });

  beforeEach(async () => {
    freezeClockAt('2026-06-01T12:00:00.000Z');

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
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  /*
   * 05:00Z on 8 October is 01:00 on the 8th in New York and 22:00 on the
   * 7th in Los Angeles. So the 8th is today for one of them and tomorrow
   * for the other, at the same moment.
   */
  describe('one instant, two users, one date', () => {
    const instant = '2026-10-08T05:00:00.000Z';
    const date = '2026-10-08';

    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'new-york', 'America/New_York');
      await authenticate(
        app.getHttpServer(),
        'los-angeles',
        'America/Los_Angeles',
      );
    });

    it('answers GET /days/:date with 200 for the one and 404 for the other', async () => {
      const newYork = await (await at(instant, 'new-york')).day(date);
      const losAngeles = await (await at(instant, 'los-angeles')).day(date);

      expect(newYork.status).toBe(200);
      expect(newYork.body).toEqual({ date, mood: null });

      expect(losAngeles.status).toBe(404);
      expect(losAngeles.body).toEqual(notFound(date));
    });

    it('answers PUT /days/:date/mood with 200 for the one and 404 for the other', async () => {
      const newYork = await (await at(instant, 'new-york')).setMood(date);
      const losAngeles = await (await at(instant, 'los-angeles')).setMood(date);

      expect(newYork.status).toBe(200);
      expect(newYork.body).toEqual({ date, mood: 'Even' });

      expect(losAngeles.status).toBe(404);
      expect(losAngeles.body).toEqual(notFound(date));

      /* One row, and it is New York's. */
      expect(await dayRows()).toEqual([{ date, mood: 'Even' }]);
    });
  });

  /*
   * Karachi is five hours ahead of UTC all year. At 20:00Z on the 9th it is
   * 01:00 on the 10th there. So the 10th is today in Karachi while it is
   * still tomorrow in UTC, and the 11th is tomorrow in both.
   */
  describe('today, yesterday and tomorrow, in a zone that is not UTC', () => {
    const instant = '2026-08-09T20:00:00.000Z';

    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'karachi', 'Asia/Karachi');
    });

    it('agrees with GET /days/today about which date today is', async () => {
      const karachi = await at(instant, 'karachi');
      const today = (await karachi.get('/days/today').expect(200)).body as {
        date: string;
      };

      expect(today.date).toBe('2026-08-10');
      await karachi.day(today.date).expect(200);
      await karachi.setMood(today.date).expect(200);
    });

    it.each([
      ['yesterday', '2026-08-09', 200],
      ['today', '2026-08-10', 200],
      ['tomorrow', '2026-08-11', 404],
      ['a date years away', '2031-01-01', 404],
      ['a date years ago', '2019-01-01', 200],
    ])(
      'answers GET /days/:date for %s (%s) with %i',
      async (_label, date, status) => {
        const karachi = await at(instant, 'karachi');

        await karachi.day(date).expect(status);
      },
    );

    it.each([
      ['yesterday', '2026-08-09', 200],
      ['today', '2026-08-10', 200],
      ['tomorrow', '2026-08-11', 404],
      ['a date years away', '2031-01-01', 404],
      ['a date years ago', '2019-01-01', 200],
    ])(
      'answers PUT /days/:date/mood for %s (%s) with %i',
      async (_label, date, status) => {
        const karachi = await at(instant, 'karachi');

        await karachi.setMood(date).expect(status);
      },
    );

    it('answers 404 until midnight in Karachi and 200 from then on', async () => {
      const date = '2026-08-11';

      const before = await at('2026-08-10T18:59:59.000Z', 'karachi');
      await before.day(date).expect(404);
      await before.setMood(date).expect(404);

      const after = await at('2026-08-10T19:00:00.000Z', 'karachi');
      await after.day(date).expect(200);
      await after.setMood(date).expect(200);
    });
  });

  describe('what a refused request leaves behind', () => {
    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'karachi', 'Asia/Karachi');
    });

    it('creates no day row when PUT is refused', async () => {
      const karachi = await at('2026-08-09T20:00:00.000Z', 'karachi');

      expect(await dayRows()).toEqual([]);

      await karachi.setMood('2026-08-11', 'Good').expect(404);
      await karachi.setMood('2026-08-11', null).expect(404);

      expect(await dayRows()).toEqual([]);
    });

    it('creates no day row when GET is refused', async () => {
      const karachi = await at('2026-08-09T20:00:00.000Z', 'karachi');

      await karachi.day('2026-08-11').expect(404);

      expect(await dayRows()).toEqual([]);
    });

    /*
     * Before Day 17c a mood could be set on any date, so a row on a future
     * date may already be stored. It is not deleted and it is not changed.
     * It is simply not there to be asked for until its date arrives.
     */
    it('answers 404 for a future day that is already stored, and leaves it as it is', async () => {
      const [{ id }] = await dataSource.query<{ id: string }[]>(
        `SELECT id FROM users WHERE email = 'karachi@example.com'`,
      );
      await dataSource.query(
        `INSERT INTO days (id, date, mood, created_at, user_id)
         VALUES ('set-early', '2026-08-11', 'Hard', '2026-08-01T10:00:00.000Z', ?)`,
        [id],
      );

      const karachi = await at('2026-08-09T20:00:00.000Z', 'karachi');

      await karachi.day('2026-08-11').expect(404);
      await karachi.setMood('2026-08-11', 'Light').expect(404);
      expect(await dayRows()).toEqual([{ date: '2026-08-11', mood: 'Hard' }]);

      const onTheDay = await at('2026-08-11T06:00:00.000Z', 'karachi');
      expect((await onTheDay.day('2026-08-11').expect(200)).body).toEqual({
        date: '2026-08-11',
        mood: 'Hard',
      });
    });
  });

  /*
   * A date that is not a calendar date is refused before anyone asks
   * whether it is in the future, because the question has no answer for
   * it. The body is checked before the handler runs too, so a bad mood on a
   * future date is a 400 and not a 404.
   */
  describe('which refusal comes first', () => {
    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'karachi', 'Asia/Karachi');
    });

    it.each(['2031-02-31', '2031-13-01', 'not-a-date', '31-01-2031'])(
      'still answers 400 for %s, which is not a calendar date',
      async (date) => {
        const karachi = await at('2026-08-09T20:00:00.000Z', 'karachi');

        await karachi.day(date).expect(400);
        await karachi.setMood(date).expect(400);
      },
    );

    it('answers 400 for a mood that is not a mood, on a future date', async () => {
      const karachi = await at('2026-08-09T20:00:00.000Z', 'karachi');

      await karachi.setMood('2026-08-11', 'Ecstatic').expect(400);
      expect(await dayRows()).toEqual([]);
    });

    it('answers 401 with no credential, whatever the date', async () => {
      await request(app.getHttpServer()).get('/days/2031-01-01').expect(401);
      await request(app.getHttpServer())
        .put('/days/2031-01-01/mood')
        .send({ mood: 'Even' })
        .expect(401);
    });
  });

  /* An empty collection is a complete answer (ADR-005). */
  describe('the routes that answer with a collection', () => {
    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'karachi', 'Asia/Karachi');
    });

    it('still answers GET /entries?date= with an empty list for a future date', async () => {
      const karachi = await at('2026-08-09T20:00:00.000Z', 'karachi');
      await karachi.write('written today').expect(201);

      const listed = await karachi.get('/entries?date=2026-08-11').expect(200);
      expect(listed.body).toEqual([]);

      const counted = await karachi
        .get('/entries/count?date=2026-08-11')
        .expect(200);
      expect(counted.body).toEqual({ count: 0 });
    });

    it('still answers GET /days?from=&to= normally when to is in the future', async () => {
      const karachi = await at('2026-08-09T20:00:00.000Z', 'karachi');
      await karachi.write('written today').expect(201);

      const ranged = await karachi
        .get('/days?from=2026-08-01&to=2031-12-31')
        .expect(200);
      expect(ranged.body).toEqual([{ date: '2026-08-10', mood: null }]);

      const allFuture = await karachi
        .get('/days?from=2031-01-01&to=2031-12-31')
        .expect(200);
      expect(allFuture.body).toEqual([]);
    });
  });
});
