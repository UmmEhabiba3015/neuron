import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
import type { JournalEntry } from './../src/entries/entry.entity';

const entryFrom = (res: request.Response): JournalEntry =>
  res.body as JournalEntry;

const messagesFrom = (res: request.Response): string[] =>
  (res.body as { message: string[] }).message;

describe('EntriesController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let authorization: string;

  const api = () => {
    const agent = request(app.getHttpServer());

    return {
      get: (url: string) => agent.get(url).set('Authorization', authorization),
      post: (url: string) =>
        agent.post(url).set('Authorization', authorization),
      patch: (url: string) =>
        agent.patch(url).set('Authorization', authorization),
      delete: (url: string) =>
        agent.delete(url).set('Authorization', authorization),
    };
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
    await app.init();

    authorization = await authenticate(app.getHttpServer());
  });

  it('/entries (POST then GET)', async () => {
    const created = await api()
      .post('/entries')
      .send({ content: 'written over HTTP' })
      .expect(201);

    expect(created.body).toMatchObject({ content: 'written over HTTP' });

    await api()
      .get('/entries')
      .expect(200)
      .expect((res) => {
        expect(res.body).toContainEqual(created.body);
      });
  });

  it('/entries (POST) returns exactly id, content and createdAt', async () => {
    const created = await api()
      .post('/entries')
      .send({ content: 'written over HTTP' })
      .expect(201);

    expect(Object.keys(created.body as object)).toEqual([
      'id',
      'content',
      'createdAt',
    ]);

    const [listed] = (await api().get('/entries').expect(200)).body as object[];

    expect(Object.keys(listed)).toEqual(['id', 'content', 'createdAt']);
  });

  describe('status codes', () => {
    it.each([
      ['no content field', {}, 'content must be a string'],
      [
        'content that is not a string',
        { content: 42 },
        'content must be a string',
      ],
      [
        'empty content',
        { content: '' },
        'content must contain at least one character that is not whitespace',
      ],
      [
        'whitespace-only content',
        { content: '   ' },
        'content must contain at least one character that is not whitespace',
      ],
    ])(
      'POST /entries rejects %s with 400 and says why',
      async (_label, body, message) => {
        const rejected = await api().post('/entries').send(body).expect(400);

        expect(messagesFrom(rejected)).toEqual([message]);
      },
    );

    it('POST /entries answers a non-string content with one message', async () => {
      const rejected = await api()
        .post('/entries')
        .send({ content: 42 })
        .expect(400);

      expect(messagesFrom(rejected)).toHaveLength(1);
    });

    it('POST /entries stores content verbatim, spacing included', async () => {
      const padded = '  the spacing I chose  ';

      const created = entryFrom(
        await api().post('/entries').send({ content: padded }).expect(201),
      );

      expect(created.content).toBe(padded);

      const reread = entryFrom(
        await api().get(`/entries/${created.id}`).expect(200),
      );

      expect(reread.content).toBe(padded);
    });

    it('POST /entries accepts valid content with 201', async () => {
      await api().post('/entries').send({ content: 'real text' }).expect(201);
    });

    it('GET /entries is empty after only rejected writes', async () => {
      await api().post('/entries').send({}).expect(400);
      await api().post('/entries').send({ content: '   ' }).expect(400);

      await api()
        .get('/entries')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('GET /entries/:id returns 404 for an unknown id', async () => {
      await api().get('/entries/nope').expect(404);
    });

    it('GET /entries?word=… returns 200 and [] when nothing matches', async () => {
      await api()
        .post('/entries')
        .send({ content: 'quiet evening at home' })
        .expect(201);

      await api()
        .get('/entries')
        .query({ word: 'zzzzz' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /entries rejects an unrecognised field with 400', async () => {
      const rejected = await api()
        .post('/entries')
        .send({ content: 'x', id: 'i-picked-this-myself' })
        .expect(400);

      expect(messagesFrom(rejected)).toEqual(['property id should not exist']);
    });

    it('POST /entries names the unrecognised field', async () => {
      const rejected = await api()
        .post('/entries')
        .send({ content: 'x', contnet: 'y' })
        .expect(400);

      expect(messagesFrom(rejected)).toEqual([
        'property contnet should not exist',
      ]);
    });

    it('PATCH /entries/:id rejects an unrecognised field with 400', async () => {
      const created = entryFrom(
        await api()
          .post('/entries')
          .send({ content: 'the original text' })
          .expect(201),
      );

      const rejected = await api()
        .patch(`/entries/${created.id}`)
        .send({ contnet: 'I fixed my typo' })
        .expect(400);

      expect(messagesFrom(rejected)).toEqual([
        'property contnet should not exist',
      ]);

      const reread = entryFrom(
        await api().get(`/entries/${created.id}`).expect(200),
      );

      expect(reread.content).toBe('the original text');
    });

    it('GET /entries rejects a repeated word parameter with 400', async () => {
      const rejected = await api().get('/entries?word=a&word=b').expect(400);

      expect(messagesFrom(rejected)).toEqual(['word must be a string']);
    });

    it('GET /entries rejects an unrecognised query parameter with 400', async () => {
      const rejected = await api().get('/entries?werd=sister').expect(400);

      expect(messagesFrom(rejected)).toEqual([
        'property werd should not exist',
      ]);
    });

    it('GET /entries?word= finds nothing while GET /entries finds everything', async () => {
      const created = entryFrom(
        await api()
          .post('/entries')
          .send({ content: 'a quiet evening at home' })
          .expect(201),
      );

      await api()
        .get('/entries?word=')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });

      await api()
        .get('/entries')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([created]);
        });
    });

    it('GET /entries?word=100%25 finds the entry containing 100%', async () => {
      await api()
        .post('/entries')
        .send({ content: '100% exhausted today' })
        .expect(201);
      await api()
        .post('/entries')
        .send({ content: 'an ordinary quiet evening' })
        .expect(201);

      await api()
        .get('/entries?word=100%25')
        .expect(200)
        .expect((res) => {
          expect(res.body as JournalEntry[]).toHaveLength(1);
          expect((res.body as JournalEntry[])[0].content).toBe(
            '100% exhausted today',
          );
        });
    });

    it('PATCH /entries/:id returns 200 and the updated entry', async () => {
      const created = entryFrom(
        await api()
          .post('/entries')
          .send({ content: 'the first draft' })
          .expect(201),
      );

      const updated = entryFrom(
        await api()
          .patch(`/entries/${created.id}`)
          .send({ content: 'the second draft' })
          .expect(200),
      );

      expect(updated.content).toBe('the second draft');
      expect(updated.id).toBe(created.id);

      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('PATCH /entries/:id returns 404 for an unknown id', async () => {
      await api()
        .patch('/entries/nope')
        .send({ content: 'anything' })
        .expect(404);
    });

    it('PATCH /entries/:id returns 400 for an empty body', async () => {
      const created = entryFrom(
        await api().post('/entries').send({ content: 'unchanged' }).expect(201),
      );

      const rejected = await api()
        .patch(`/entries/${created.id}`)
        .send({})
        .expect(400);

      expect(messagesFrom(rejected)).toEqual([
        'the request body must contain at least one field to update',
      ]);
    });

    it('PATCH /entries/:id returns 400 for a content field of null', async () => {
      const created = entryFrom(
        await api().post('/entries').send({ content: 'unchanged' }).expect(201),
      );

      const rejected = await api()
        .patch(`/entries/${created.id}`)
        .send({ content: null })
        .expect(400);

      expect(messagesFrom(rejected)).toEqual(['content must be a string']);

      const reread = entryFrom(
        await api().get(`/entries/${created.id}`).expect(200),
      );

      expect(reread.content).toBe('unchanged');
    });

    it('PATCH /entries/:id returns 400 for a field named undefined', async () => {
      const created = entryFrom(
        await api().post('/entries').send({ content: 'unchanged' }).expect(201),
      );

      await api()
        .patch(`/entries/${created.id}`)
        .send({ undefined: 'x' })
        .expect(400);

      const reread = entryFrom(
        await api().get(`/entries/${created.id}`).expect(200),
      );

      expect(reread.content).toBe('unchanged');
    });

    it('DELETE /entries/:id returns 200 with the deleted entry, which is then gone', async () => {
      const created = entryFrom(
        await api()
          .post('/entries')
          .send({ content: 'here for a moment' })
          .expect(201),
      );

      const deleted = entryFrom(
        await api().delete(`/entries/${created.id}`).expect(200),
      );

      expect(deleted).toEqual(created);

      await api().get(`/entries/${created.id}`).expect(404);
    });

    it('DELETE /entries/:id returns 404 for an unknown id', async () => {
      await api().delete('/entries/nope').expect(404);
    });

    it('GET /entries/count returns 200 and { count }', async () => {
      await api()
        .get('/entries/count')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ count: 0 });
        });

      await api().post('/entries').send({ content: 'one' }).expect(201);

      await api()
        .get('/entries/count')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ count: 1 });
        });
    });
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });
});
