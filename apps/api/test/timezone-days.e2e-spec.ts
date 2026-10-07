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
 * A day ends at midnight in the timezone of the person whose day it is.
 * Every test here sets the clock, and every date is asked for over HTTP.
 */
describe('a day in the timezone of its user (e2e)', () => {
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
      today: async (): Promise<string> => {
        const response = await request(server)
          .get('/days/today')
          .set('Authorization', authorization)
          .expect(200);

        return (response.body as { date: string }).date;
      },
      write: async (content: string): Promise<void> => {
        await request(server)
          .post('/entries')
          .set('Authorization', authorization)
          .send({ content })
          .expect(201);
      },
      writtenOn: async (date: string): Promise<string[]> => {
        const response = await request(server)
          .get(`/entries?date=${date}`)
          .set('Authorization', authorization)
          .expect(200);

        return (response.body as { content: string }[]).map(
          (entry) => entry.content,
        );
      },
      datesWithEntries: async (): Promise<string[]> => {
        const response = await request(server)
          .get('/days?from=2026-01-01&to=2026-12-31')
          .set('Authorization', authorization)
          .expect(200);

        return (response.body as { date: string }[]).map((day) => day.date);
      },
    };
  };

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
   * 7th in Los Angeles.
   */
  describe('one instant, two users, two dates', () => {
    const instant = '2026-10-08T05:00:00.000Z';

    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'new-york', 'America/New_York');
      await authenticate(
        app.getHttpServer(),
        'los-angeles',
        'America/Los_Angeles',
      );
    });

    it('answers GET /days/today with a different date for each', async () => {
      expect(await (await at(instant, 'new-york')).today()).toBe('2026-10-08');
      expect(await (await at(instant, 'los-angeles')).today()).toBe(
        '2026-10-07',
      );
    });

    it('files an entry written at that instant under a different date for each', async () => {
      const newYork = await at(instant, 'new-york');
      const losAngeles = await at(instant, 'los-angeles');

      await newYork.write('one in the morning');
      await losAngeles.write('ten at night');

      expect(await newYork.writtenOn('2026-10-08')).toEqual([
        'one in the morning',
      ]);
      expect(await newYork.writtenOn('2026-10-07')).toEqual([]);
      expect(await newYork.datesWithEntries()).toEqual(['2026-10-08']);

      expect(await losAngeles.writtenOn('2026-10-07')).toEqual([
        'ten at night',
      ]);
      expect(await losAngeles.writtenOn('2026-10-08')).toEqual([]);
      expect(await losAngeles.datesWithEntries()).toEqual(['2026-10-07']);
    });

    /*
     * The entry's created_at is on the 8th and its day is the 7th. A filter
     * that looked at created_at, or a rule that worked in UTC, would find it
     * under the 8th.
     */
    it('agrees with itself: the entry is under the date today names', async () => {
      const losAngeles = await at(instant, 'los-angeles');

      await losAngeles.write('ten at night');

      expect(await losAngeles.writtenOn(await losAngeles.today())).toEqual([
        'ten at night',
      ]);
    });
  });

  /*
   * Karachi is five hours ahead of UTC all year, so midnight there is
   * 19:00Z on the date before.
   */
  describe('midnight in a zone that is not UTC', () => {
    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'karachi', 'Asia/Karachi');
    });

    it.each([
      ['one second before', '2026-08-09T18:59:59.000Z', '2026-08-09'],
      ['exactly at', '2026-08-09T19:00:00.000Z', '2026-08-10'],
      ['one second after', '2026-08-09T19:00:01.000Z', '2026-08-10'],
    ])(
      '%s midnight, today and a new entry are both on the right date',
      async (_label, instant, date) => {
        const karachi = await at(instant, 'karachi');

        await karachi.write('written just now');

        expect(await karachi.today()).toBe(date);
        expect(await karachi.writtenOn(date)).toEqual(['written just now']);
        expect(await karachi.datesWithEntries()).toEqual([date]);
      },
    );

    it('does not end the day at 04:00 any more', async () => {
      const before = await at('2026-08-09T22:59:00.000Z', 'karachi');
      await before.write('03:59 in Karachi');

      const after = await at('2026-08-09T23:01:00.000Z', 'karachi');
      await after.write('04:01 in Karachi');

      expect(await after.writtenOn('2026-08-10')).toEqual([
        '04:01 in Karachi',
        '03:59 in Karachi',
      ]);
    });
  });

  /*
   * London is on UTC in winter and an hour ahead in summer, so the same
   * time on the clock in UTC is a different side of midnight in each.
   */
  describe('daylight saving', () => {
    beforeEach(async () => {
      await authenticate(app.getHttpServer(), 'london', 'Europe/London');
    });

    it('puts 23:30Z in July on the next date', async () => {
      const london = await at('2026-07-15T23:30:00.000Z', 'london');

      await london.write('half past midnight, in summer');

      expect(await london.today()).toBe('2026-07-16');
      expect(await london.writtenOn('2026-07-16')).toHaveLength(1);
    });

    it('puts 23:30Z in January on the same date', async () => {
      const london = await at('2026-01-15T23:30:00.000Z', 'london');

      await london.write('half past eleven, in winter');

      expect(await london.today()).toBe('2026-01-15');
      expect(await london.writtenOn('2026-01-15')).toHaveLength(1);
    });
  });

  /*
   * The day is resolved once, when the entry is written (ADR-015). Changing
   * the stored timezone changes where the next entry goes and leaves the
   * earlier one where it was.
   */
  describe('when the timezone of a user changes', () => {
    const instant = '2026-10-08T05:00:00.000Z';

    const daysAndEntries = () =>
      dataSource.query<Record<string, unknown>[]>(
        `SELECT entries.content, entries.day_id, days.date
         FROM entries JOIN days ON days.id = entries.day_id
         ORDER BY entries.content`,
      );

    it('keeps an entry on the day it was written on', async () => {
      await authenticate(
        app.getHttpServer(),
        'traveller',
        'America/Los_Angeles',
      );

      const beforeTheMove = await at(instant, 'traveller');
      await beforeTheMove.write('written in Los Angeles');

      const rowsBefore = await daysAndEntries();
      expect(rowsBefore).toEqual([
        expect.objectContaining({
          content: 'written in Los Angeles',
          date: '2026-10-07',
        }),
      ]);

      await dataSource.query(
        `UPDATE users SET timezone = 'Asia/Tokyo' WHERE email = 'traveller@example.com'`,
      );

      const afterTheMove = await at(instant, 'traveller');

      expect(await afterTheMove.today()).toBe('2026-10-08');
      expect(await afterTheMove.writtenOn('2026-10-07')).toEqual([
        'written in Los Angeles',
      ]);
      expect(await afterTheMove.writtenOn('2026-10-08')).toEqual([]);
      expect(await daysAndEntries()).toEqual(rowsBefore);
    });

    it('files the next entry by the new timezone, beside the old one', async () => {
      await authenticate(
        app.getHttpServer(),
        'traveller',
        'America/Los_Angeles',
      );

      await (await at(instant, 'traveller')).write('written in Los Angeles');

      await dataSource.query(
        `UPDATE users SET timezone = 'Asia/Tokyo' WHERE email = 'traveller@example.com'`,
      );

      const afterTheMove = await at(instant, 'traveller');
      await afterTheMove.write('written in Tokyo');

      expect(await afterTheMove.writtenOn('2026-10-07')).toEqual([
        'written in Los Angeles',
      ]);
      expect(await afterTheMove.writtenOn('2026-10-08')).toEqual([
        'written in Tokyo',
      ]);
    });
  });
});
