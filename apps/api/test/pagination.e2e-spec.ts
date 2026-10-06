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

describe('pagination (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;

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

    for (let i = 1; i <= 12; i++) {
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', alice)
        .send({ content: `entry ${String(i).padStart(2, '0')}` })
        .expect(201);
    }
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  const list = (query: string) =>
    request(app.getHttpServer())
      .get(`/entries${query}`)
      .set('Authorization', alice);

  const contents = (body: unknown) =>
    (body as { content: string }[]).map((e) => e.content);

  it('returns a page of the requested size', async () => {
    const page = await list('?limit=5').expect(200);
    expect(page.body).toHaveLength(5);
  });

  /*
   * The query string carries "5", not 5. This passes only because the global
   * pipe has transform:true and converts from the declared type, so it is
   * also the test that fails if that is ever turned off.
   */
  it('reads limit and offset as numbers even though a query string is text', async () => {
    const first = await list('?limit=4&offset=0').expect(200);
    const second = await list('?limit=4&offset=4').expect(200);

    expect(contents(first.body)).toHaveLength(4);
    expect(contents(second.body)).toHaveLength(4);
    expect(contents(first.body)).not.toEqual(contents(second.body));
  });

  it('walks the whole journal without repeating or skipping an entry', async () => {
    const seen: string[] = [];

    for (let offset = 0; offset < 12; offset += 5) {
      const page = await list(`?limit=5&offset=${offset}`).expect(200);
      seen.push(...contents(page.body));
    }

    expect(seen).toHaveLength(12);
    expect(new Set(seen).size).toBe(12);
  });

  it('returns an empty page past the end rather than an error', async () => {
    const page = await list('?limit=5&offset=500').expect(200);
    expect(page.body).toEqual([]);
  });

  it('refuses a limit above the maximum', async () => {
    await list('?limit=201').expect(400);
  });

  it('refuses a limit of zero, a negative offset, and a non-number', async () => {
    await list('?limit=0').expect(400);
    await list('?offset=-1').expect(400);
    await list('?limit=lots').expect(400);
    await list('?limit=1.5').expect(400);
  });

  it('paginates a search as well as a listing', async () => {
    const page = await list('?word=entry&limit=3').expect(200);
    expect(page.body).toHaveLength(3);
  });

  it('defaults to a page rather than the whole journal', async () => {
    const all = await list('').expect(200);
    expect(all.body).toHaveLength(12);
  });
});
