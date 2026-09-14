import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { JournalEntry } from './../src/entries/entry.entity';
import {
  authenticate,
  closeTestDataSource,
  createTestDataSource,
} from './test-database';

describe('entry ownership (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;
  let bob: string;
  let aliceEntryId: string;

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

    const created = await request(app.getHttpServer())
      .post('/entries')
      .set('Authorization', alice)
      .send({ content: "Alice's private thought" })
      .expect(201);

    aliceEntryId = (created.body as { id: string }).id;
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  describe('reads', () => {
    it('should not show one user the other user entries', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .set('Authorization', bob)
        .send({ content: "Bob's private thought" })
        .expect(201);

      const forAlice = await request(app.getHttpServer())
        .get('/entries')
        .set('Authorization', alice)
        .expect(200);
      const forBob = await request(app.getHttpServer())
        .get('/entries')
        .set('Authorization', bob)
        .expect(200);

      expect((forAlice.body as JournalEntry[]).map((e) => e.content)).toEqual([
        "Alice's private thought",
      ]);
      expect((forBob.body as JournalEntry[]).map((e) => e.content)).toEqual([
        "Bob's private thought",
      ]);
    });

    it('should answer 404 when one user asks for the other entry by id', async () => {
      await request(app.getHttpServer())
        .get(`/entries/${aliceEntryId}`)
        .set('Authorization', bob)
        .expect(404);
    });

    it('should still let the owner read their own entry', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entries/${aliceEntryId}`)
        .set('Authorization', alice)
        .expect(200);

      expect((response.body as JournalEntry).content).toBe(
        "Alice's private thought",
      );
    });

    it('should not match another user entry in a search', async () => {
      const response = await request(app.getHttpServer())
        .get('/entries?word=private')
        .set('Authorization', bob)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should count only the caller entries', async () => {
      const response = await request(app.getHttpServer())
        .get('/entries/count')
        .set('Authorization', bob)
        .expect(200);

      expect(response.body).toEqual({ count: 0 });
    });
  });

  describe('writes', () => {
    it('should answer 404 when one user updates the other entry', async () => {
      await request(app.getHttpServer())
        .patch(`/entries/${aliceEntryId}`)
        .set('Authorization', bob)
        .send({ content: 'rewritten by Bob' })
        .expect(404);

      const unchanged = await request(app.getHttpServer())
        .get(`/entries/${aliceEntryId}`)
        .set('Authorization', alice)
        .expect(200);

      expect((unchanged.body as JournalEntry).content).toBe(
        "Alice's private thought",
      );
    });

    it('should answer 404 when one user deletes the other entry', async () => {
      await request(app.getHttpServer())
        .delete(`/entries/${aliceEntryId}`)
        .set('Authorization', bob)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/entries/${aliceEntryId}`)
        .set('Authorization', alice)
        .expect(200);
    });

    it('should still let the owner update and delete their own entry', async () => {
      await request(app.getHttpServer())
        .patch(`/entries/${aliceEntryId}`)
        .set('Authorization', alice)
        .send({ content: 'edited by Alice' })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/entries/${aliceEntryId}`)
        .set('Authorization', alice)
        .expect(200);
    });
  });

  it('should answer 404 identically for a missing id and another user entry', async () => {
    const notYours = await request(app.getHttpServer())
      .get(`/entries/${aliceEntryId}`)
      .set('Authorization', bob)
      .expect(404);

    const doesNotExist = await request(app.getHttpServer())
      .get('/entries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', bob)
      .expect(404);

    expect(notYours.body).toEqual({
      ...(doesNotExist.body as object),
      message: (notYours.body as { message: string }).message,
    });
    expect((notYours.body as { message: string }).message).not.toContain(
      'alice',
    );
  });

  it('should never put userId in a response body', async () => {
    const list = await request(app.getHttpServer())
      .get('/entries')
      .set('Authorization', alice)
      .expect(200);

    expect(Object.keys((list.body as object[])[0]).sort()).toEqual([
      'content',
      'createdAt',
      'id',
    ]);
  });
});
