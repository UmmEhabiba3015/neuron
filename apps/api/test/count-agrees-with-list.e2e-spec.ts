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
  ])('agrees for %s', async (_label, countQuery, listQuery) => {
    const counted = await countFor(countQuery);
    const walked = await walk(listQuery === '' ? '' : `?${listQuery.slice(1)}`);

    expect(counted).toBe(walked.length);
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
