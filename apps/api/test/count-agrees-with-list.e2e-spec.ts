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
 * The invariant: for every filter the listing accepts, the count has to
 * agree with the number of entries the listing actually yields.
 *
 * It did not. Count took no filters at all, so counting a search returned
 * the size of the whole journal -- a plausible number, quietly wrong.
 */
describe('count agrees with the listing (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;
  let bob: string;

  const CONTENTS = [
    'sister called about the flat',
    'sister again, briefly',
    'walked the canal',
    'work was work',
    'slept badly',
    'the flat people said Tuesday',
    'nothing much today',
  ];

  /*
   * A date filter can only be shown to agree if the journal spans more than
   * one day, so the clock is set: these three are written on the 8th and
   * CONTENTS on the 9th. Counting everything where the listing narrows to a
   * day would otherwise give the same number and prove nothing.
   */
  const EARLIER_CONTENTS = [
    'the day before, first',
    'the day before, second, about the flat',
    'the day before, third',
  ];

  beforeEach(async () => {
    freezeClockAt('2026-08-08T12:00:00.000Z');

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

    for (const content of EARLIER_CONTENTS) {
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', alice)
        .send({ content })
        .expect(201);
    }

    /*
     * A day later. The tokens issued on the 8th have expired by now, so both
     * users sign in again.
     */
    moveClockTo('2026-08-09T12:00:00.000Z');
    alice = await login(app.getHttpServer(), 'alice');
    bob = await login(app.getHttpServer(), 'bob');

    for (const content of CONTENTS) {
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', alice)
        .send({ content })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/entries')
      .set('Authorization', bob)
      .send({ content: "bob's entry about his sister" })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  const countFor = async (query: string): Promise<number> => {
    const response = await request(app.getHttpServer())
      .get(`/entries/count${query}`)
      .set('Authorization', alice)
      .expect(200);

    return (response.body as { count: number }).count;
  };

  /*
   * Walked a page at a time rather than asked for in one request, because
   * the point is that the count matches what a paginating client can
   * actually reach.
   */
  const walk = async (query: string): Promise<string[]> => {
    const limit = 2;
    const seen: string[] = [];

    for (let offset = 0; ; offset += limit) {
      const separator = query === '' ? '?' : '&';
      const response = await request(app.getHttpServer())
        .get(`/entries${query}${separator}limit=${limit}&offset=${offset}`)
        .set('Authorization', alice)
        .expect(200);

      const page = response.body as { content: string }[];
      seen.push(...page.map((entry) => entry.content));

      if (page.length < limit) {
        return seen;
      }
    }
  };

  it.each([
    ['no filter', '', ''],
    ['a word that matches twice', '?word=sister', '&word=sister'],
    ['a word that matches once', '?word=canal', '&word=canal'],
    ['a word that matches nothing', '?word=zzzz', '&word=zzzz'],
    ['an empty word', '?word=', '&word='],
    ['a date with seven entries', '?date=2026-08-09', '&date=2026-08-09'],
    ['a date with three entries', '?date=2026-08-08', '&date=2026-08-08'],
    ['a date with no entries', '?date=2026-08-01', '&date=2026-08-01'],
    [
      'a date and a word together',
      '?date=2026-08-09&word=flat',
      '&date=2026-08-09&word=flat',
    ],
    [
      'a date and a word that only matches on another date',
      '?date=2026-08-08&word=sister',
      '&date=2026-08-08&word=sister',
    ],
  ])('agrees for %s', async (_label, countQuery, listQuery) => {
    const counted = await countFor(countQuery);
    const walked = await walk(listQuery === '' ? '' : `?${listQuery.slice(1)}`);

    expect(counted).toBe(walked.length);
  });

  /*
   * Agreement alone would also hold if both ignored the date. These pin the
   * numbers, so a filter dropped from the shared builder fails here as well
   * as in the suite that tests the filter itself.
   */
  it('counts a day as that day and not as the whole journal', async () => {
    expect(await countFor('')).toBe(10);
    expect(await countFor('?date=2026-08-09')).toBe(7);
    expect(await countFor('?date=2026-08-08')).toBe(3);
    expect(await countFor('?date=2026-08-09&word=flat')).toBe(2);
  });

  it('counts only the caller, not everyone who wrote that word', async () => {
    expect(await countFor('?word=sister')).toBe(2);
  });

  it('refuses a misspelled filter rather than counting everything', async () => {
    await request(app.getHttpServer())
      .get('/entries/count?wrod=sister')
      .set('Authorization', alice)
      .expect(400);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/entries/count').expect(401);
  });
});
