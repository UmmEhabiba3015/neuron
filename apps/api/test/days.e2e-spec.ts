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

describe('days (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;
  let bob: string;

  const countDays = async () => {
    const rows = await dataSource.query<{ c: number }[]>(
      'SELECT COUNT(*) AS c FROM days',
    );
    return Number(rows[0].c);
  };

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
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  const write = (auth: string, content: string) =>
    request(app.getHttpServer())
      .post('/entries')
      .set('Authorization', auth)
      .send({ content })
      .expect(201);

  it('creates one day for several entries written the same day', async () => {
    await write(alice, 'first');
    await write(alice, 'second');
    await write(alice, 'third');

    expect(await countDays()).toBe(1);
  });

  it('gives each user their own day for the same date', async () => {
    await write(alice, "alice's");
    await write(bob, "bob's");

    expect(await countDays()).toBe(2);
  });

  it('stamps every entry with the day it belongs to', async () => {
    await write(alice, 'one');
    await write(alice, 'two');

    const orphans = await dataSource.query<{ c: number }[]>(
      'SELECT COUNT(*) AS c FROM entries WHERE day_id IS NULL',
    );
    expect(Number(orphans[0].c)).toBe(0);
  });

  it('never puts day_id in a response', async () => {
    const created = await write(alice, 'watch the keys');
    expect(Object.keys(created.body as object).sort()).toEqual([
      'content',
      'createdAt',
      'date',
      'id',
    ]);

    const fetched = await request(app.getHttpServer())
      .get(`/entries/${(created.body as { id: string }).id}`)
      .set('Authorization', alice)
      .expect(200);
    expect(Object.keys(fetched.body as object).sort()).toEqual([
      'content',
      'createdAt',
      'date',
      'id',
    ]);
  });

  it('keeps the day when its last entry is deleted', async () => {
    const created = await write(alice, 'the only thing today');
    expect(await countDays()).toBe(1);

    await request(app.getHttpServer())
      .delete(`/entries/${(created.body as { id: string }).id}`)
      .set('Authorization', alice)
      .expect(204);

    expect(await countDays()).toBe(1);
  });

  it('keeps the day while any entry on it survives', async () => {
    const first = await write(alice, 'one');
    await write(alice, 'two');

    await request(app.getHttpServer())
      .delete(`/entries/${(first.body as { id: string }).id}`)
      .set('Authorization', alice)
      .expect(204);

    expect(await countDays()).toBe(1);
  });

  it('deletes no day at all, whoever deletes an entry', async () => {
    await write(alice, "alice's");
    const bobEntry = await write(bob, "bob's");
    expect(await countDays()).toBe(2);

    await request(app.getHttpServer())
      .delete(`/entries/${(bobEntry.body as { id: string }).id}`)
      .set('Authorization', bob)
      .expect(204);

    expect(await countDays()).toBe(2);
  });
});
