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
  seedEntries,
} from './test-database';

describe('days in a range (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;
  let bob: string;

  /*
   * The server files an entry under the date its own clock says. So to write
   * on a date through the API, the clock is moved there first. An access
   * token lasts fifteen minutes, which is why Alice signs in again after the
   * move.
   */
  const writeOn = async (date: string, content: string): Promise<string> => {
    moveClockTo(`${date}T12:00:00.000Z`);
    alice = await login(app.getHttpServer(), 'alice');

    const created = await request(app.getHttpServer())
      .post('/entries')
      .set('Authorization', alice)
      .send({ content })
      .expect(201);

    return (created.body as { id: string }).id;
  };

  const setMood = (date: string, mood: string) =>
    request(app.getHttpServer())
      .put(`/days/${date}/mood`)
      .set('Authorization', alice)
      .send({ mood })
      .expect(200);

  const remove = (id: string) =>
    request(app.getHttpServer())
      .delete(`/entries/${id}`)
      .set('Authorization', alice)
      .expect(204);

  /*
   * The clock starts on the latest date any test here touches. A mood cannot
   * be set on a date that has not happened yet, so every date below has to
   * be today or earlier.
   */
  beforeEach(async () => {
    freezeClockAt('2026-10-05T12:00:00.000Z');

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

    const [{ id: aliceId }] = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM users WHERE email = 'alice@example.com'`,
    );

    for (const [date, mood] of [
      ['2026-07-31', 'Low'],
      ['2026-08-01', 'Even'],
      ['2026-08-15', 'Good'],
      ['2026-08-31', 'Hard'],
      ['2026-09-01', 'Light'],
    ] as const) {
      /*
       * A date is listed only if it has an entry that is not deleted, so
       * each of the five gets one. They are put straight into the database:
       * signing in again for each date would cost five password checks
       * before every test.
       */
      await seedEntries(
        dataSource,
        [
          {
            id: `entry-on-${date}`,
            content: `written on ${date}`,
            createdAt: `${date}T12:00:00.000Z`,
          },
        ],
        aliceId,
      );
      await setMood(date, mood);
    }
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
    releaseClock();
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

  /*
   * ADR-020, decision 5. October is empty when each of these starts, so the
   * answer is about the one date the test touches.
   */
  describe('which dates are listed', () => {
    const october = async () =>
      (await range(alice, '2026-10-01', '2026-10-31').expect(200))
        .body as unknown;

    it('lists a date that has a live entry, with a mood or without one', async () => {
      await writeOn('2026-10-05', 'no mood on this day');

      expect(await october()).toEqual([{ date: '2026-10-05', mood: null }]);
    });

    it('does not list a date that has a mood and no entry', async () => {
      await setMood('2026-10-05', 'Even');

      expect(await october()).toEqual([]);
    });

    it('does not list a date whose entries are all deleted, mood or not', async () => {
      const first = await writeOn('2026-10-05', 'one');
      const second = await writeOn('2026-10-05', 'two');
      await setMood('2026-10-05', 'Good');

      await remove(first);
      expect(await october()).toEqual([{ date: '2026-10-05', mood: 'Good' }]);

      await remove(second);
      expect(await october()).toEqual([]);
    });

    it('lists the date again, with the mood it had, once a new entry is written on it', async () => {
      const only = await writeOn('2026-10-05', 'written and then deleted');
      await setMood('2026-10-05', 'Low');
      await remove(only);
      expect(await october()).toEqual([]);

      await writeOn('2026-10-05', 'written afterwards');

      expect(await october()).toEqual([{ date: '2026-10-05', mood: 'Low' }]);
    });

    it('does not list a date for one user because another user wrote on it', async () => {
      await writeOn('2026-10-05', "alice's");
      bob = await login(app.getHttpServer(), 'bob');

      const bobs = await range(bob, '2026-10-01', '2026-10-31').expect(200);
      expect(bobs.body).toEqual([]);
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
