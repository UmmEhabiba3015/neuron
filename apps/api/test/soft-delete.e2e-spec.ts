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
} from './test-database';

/*
 * ADR-020: a deleted entry behaves as if it never existed, and its row is
 * still in the table.
 *
 * Alice writes three entries a minute apart and deletes the middle one. The
 * middle one is chosen so that a listing which forgot about it would show it
 * between the other two, and a page of one would land on it.
 *
 * Everything happens inside fifteen minutes of the clock, because that is
 * how long an access token lasts.
 */
describe('a deleted entry (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;
  let bob: string;

  let earlier: WireEntryBody;
  let doomed: WireEntryBody;
  let later: WireEntryBody;

  interface WireEntryBody {
    id: string;
    content: string;
    createdAt: string;
  }

  const TODAY = '2026-08-09';
  const DELETED_AT = '2026-08-09T12:05:00.000Z';
  const DOOMED_CONTENT = 'the canal again, and this one will go';

  const as = (auth: string) => {
    const agent = request(app.getHttpServer());

    return {
      get: (url: string) => agent.get(url).set('Authorization', auth),
      post: (url: string) => agent.post(url).set('Authorization', auth),
      patch: (url: string) => agent.patch(url).set('Authorization', auth),
      put: (url: string) => agent.put(url).set('Authorization', auth),
      delete: (url: string) => agent.delete(url).set('Authorization', auth),
    };
  };

  const write = async (auth: string, content: string) =>
    (await as(auth).post('/entries').send({ content }).expect(201))
      .body as WireEntryBody;

  const rowOf = async (id: string) =>
    (
      await dataSource.query<
        { content: string; deleted_at: string | null; day_id: string }[]
      >(`SELECT content, deleted_at, day_id FROM entries WHERE id = ?`, [id])
    )[0];

  const dayRows = () =>
    dataSource.query<{ id: string; date: string; mood: string | null }[]>(
      `SELECT d.id, d.date, d.mood FROM days d
       JOIN users u ON u.id = d.user_id
       WHERE u.email = 'alice@example.com'`,
    );

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

    alice = await authenticate(app.getHttpServer(), 'alice');
    bob = await authenticate(app.getHttpServer(), 'bob');

    earlier = await write(alice, 'walked the canal');
    moveClockTo('2026-08-09T12:01:00.000Z');
    doomed = await write(alice, DOOMED_CONTENT);
    moveClockTo('2026-08-09T12:02:00.000Z');
    later = await write(alice, 'work was work');

    moveClockTo(DELETED_AT);
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  describe('DELETE /entries/:id on a live entry of the caller', () => {
    it('answers 204 with no body', async () => {
      const response = await as(alice)
        .delete(`/entries/${doomed.id}`)
        .expect(204);

      expect(response.text).toBe('');
      expect(response.body).toEqual({});
      expect(response.headers['content-type']).toBeUndefined();
    });

    it('leaves the row in the table, with deleted_at set to the instant of the delete', async () => {
      expect((await rowOf(doomed.id)).deleted_at).toBeNull();

      await as(alice).delete(`/entries/${doomed.id}`).expect(204);

      expect(await rowOf(doomed.id)).toEqual({
        content: DOOMED_CONTENT,
        deleted_at: DELETED_AT,
        day_id: (await rowOf(earlier.id)).day_id,
      });
    });

    it('leaves the other entries alive', async () => {
      await as(alice).delete(`/entries/${doomed.id}`).expect(204);

      expect((await rowOf(earlier.id)).deleted_at).toBeNull();
      expect((await rowOf(later.id)).deleted_at).toBeNull();
    });
  });

  describe("DELETE /entries/:id on another user's entry", () => {
    it('answers 404 and changes nothing', async () => {
      await as(bob).delete(`/entries/${doomed.id}`).expect(404);

      expect((await rowOf(doomed.id)).deleted_at).toBeNull();
      await as(alice).get(`/entries/${doomed.id}`).expect(200);
    });
  });

  describe('once the entry is deleted', () => {
    beforeEach(async () => {
      await as(alice).delete(`/entries/${doomed.id}`).expect(204);
    });

    describe('GET /entries', () => {
      it.each([
        ['no filter', ''],
        ['a word the deleted entry contains', '?word=canal'],
        ['a word only the deleted entry contains', '?word=again'],
        ['the date it was written on', `?date=${TODAY}`],
        ['that date and that word', `?date=${TODAY}&word=canal`],
        ['a limit that would have room for it', '?limit=3'],
        ['an offset of zero', '?offset=0'],
        ['a limit and an offset', '?limit=200&offset=0'],
      ])('does not list it with %s', async (_label, query) => {
        const listed = (await as(alice).get(`/entries${query}`).expect(200))
          .body as WireEntryBody[];

        expect(listed.map((entry) => entry.id)).not.toContain(doomed.id);
      });

      /*
       * Newest first, the three were later, doomed, earlier. If the deleted
       * one still held a place in the order, the second page of one would be
       * it, or would be empty.
       */
      it('does not leave a gap in the pages where it was', async () => {
        const page = async (offset: number) =>
          (
            (
              await as(alice)
                .get(`/entries?limit=1&offset=${offset}`)
                .expect(200)
            ).body as WireEntryBody[]
          ).map((entry) => entry.id);

        expect(await page(0)).toEqual([later.id]);
        expect(await page(1)).toEqual([earlier.id]);
        expect(await page(2)).toEqual([]);
      });

      it('lists exactly the two that are left', async () => {
        const listed = (await as(alice).get('/entries').expect(200))
          .body as WireEntryBody[];

        expect(listed).toEqual([later, earlier]);
      });
    });

    describe('GET /entries/count', () => {
      it.each([
        ['no filter', '', 2],
        ['a word the deleted entry contains', '?word=canal', 1],
        ['a word only the deleted entry contains', '?word=again', 0],
        ['the date it was written on', `?date=${TODAY}`, 2],
        ['that date and that word', `?date=${TODAY}&word=canal`, 1],
      ])('does not count it with %s', async (_label, query, expected) => {
        const response = await as(alice)
          .get(`/entries/count${query}`)
          .expect(200);

        expect(response.body).toEqual({ count: expected });
      });
    });

    describe('GET /entries/:id', () => {
      it('answers 404', async () => {
        await as(alice).get(`/entries/${doomed.id}`).expect(404);
      });

      it('answers exactly as it does for an id that never existed', async () => {
        const never = '00000000-0000-0000-0000-000000000000';

        const deleted = await as(alice)
          .get(`/entries/${doomed.id}`)
          .expect(404);
        const missing = await as(alice).get(`/entries/${never}`).expect(404);

        expect(JSON.stringify(deleted.body).replaceAll(doomed.id, never)).toBe(
          JSON.stringify(missing.body),
        );
      });
    });

    describe('PATCH /entries/:id', () => {
      it('answers 404 and leaves the row as it was', async () => {
        await as(alice)
          .patch(`/entries/${doomed.id}`)
          .send({ content: 'written over a deleted entry' })
          .expect(404);

        expect(await rowOf(doomed.id)).toMatchObject({
          content: DOOMED_CONTENT,
          deleted_at: DELETED_AT,
        });
      });
    });

    describe('DELETE /entries/:id a second time', () => {
      it('answers 404 and keeps the first deleted_at', async () => {
        moveClockTo('2026-08-09T12:09:00.000Z');

        await as(alice).delete(`/entries/${doomed.id}`).expect(404);

        expect((await rowOf(doomed.id)).deleted_at).toBe(DELETED_AT);
      });
    });

    it('is invisible to another user as well, on every route', async () => {
      await as(bob).get(`/entries/${doomed.id}`).expect(404);
      await as(bob)
        .patch(`/entries/${doomed.id}`)
        .send({ content: 'bob' })
        .expect(404);
      await as(bob).delete(`/entries/${doomed.id}`).expect(404);

      expect((await as(bob).get('/entries').expect(200)).body).toEqual([]);
      expect((await as(bob).get('/entries/count').expect(200)).body).toEqual({
        count: 0,
      });
      expect(await rowOf(doomed.id)).toMatchObject({
        content: DOOMED_CONTENT,
        deleted_at: DELETED_AT,
      });
    });
  });

  describe('the day of a deleted entry', () => {
    const removeAll = async () => {
      for (const entry of [earlier, doomed, later]) {
        await as(alice).delete(`/entries/${entry.id}`).expect(204);
      }
    };

    beforeEach(async () => {
      await as(alice)
        .put(`/days/${TODAY}/mood`)
        .send({ mood: 'Good' })
        .expect(200);
    });

    it('keeps its row and its mood when its last entry is deleted', async () => {
      const before = await dayRows();
      expect(before).toHaveLength(1);

      await removeAll();

      expect(await dayRows()).toEqual([
        { id: before[0].id, date: TODAY, mood: 'Good' },
      ]);
    });

    it('still answers with its mood on GET /days/:date and GET /days/today', async () => {
      await removeAll();

      expect((await as(alice).get(`/days/${TODAY}`).expect(200)).body).toEqual({
        date: TODAY,
        mood: 'Good',
      });
      expect((await as(alice).get('/days/today').expect(200)).body).toEqual({
        date: TODAY,
        mood: 'Good',
      });
    });

    it('is the day a new entry is filed under, mood included', async () => {
      const [day] = await dayRows();
      await removeAll();

      const fresh = await write(alice, 'written after everything was deleted');

      expect(await dayRows()).toEqual([
        { id: day.id, date: TODAY, mood: 'Good' },
      ]);
      expect((await rowOf(fresh.id)).day_id).toBe(day.id);
      expect(
        (await as(alice).get(`/entries?date=${TODAY}`).expect(200)).body,
      ).toEqual([fresh]);
    });
  });

  /*
   * The contract's WireEntry has no deleted_at, and the compiler does not
   * check for extra fields: an entity with one more property is still
   * assignable to it. So every answer of every entries route is looked at
   * here, before a delete and after one.
   */
  describe('what the entries routes answer with', () => {
    const everyAnswer = async (): Promise<request.Response[]> => [
      await as(alice).post('/entries').send({ content: 'one more' }),
      await as(alice).get('/entries'),
      await as(alice).get('/entries?word=canal'),
      await as(alice).get(`/entries?date=${TODAY}`),
      await as(alice).get('/entries?limit=200&offset=0'),
      await as(alice).get('/entries/count'),
      await as(alice).get(`/entries/${earlier.id}`),
      await as(alice).get(`/entries/${doomed.id}`),
      await as(alice).patch(`/entries/${earlier.id}`).send({ content: 'new' }),
      await as(alice).patch(`/entries/${doomed.id}`).send({ content: 'new' }),
      await as(alice).delete(`/entries/${doomed.id}`),
      await as(alice).delete(`/entries/${later.id}`),
    ];

    const entriesIn = (response: request.Response): object[] => {
      const body = response.body as unknown;

      if (Array.isArray(body)) {
        return body as object[];
      }

      return typeof body === 'object' && body !== null && 'id' in body
        ? [body]
        : [];
    };

    it('never contains deleted_at, before a delete or after one', async () => {
      const answers = [...(await everyAnswer()), ...(await everyAnswer())];

      expect(answers.map((answer) => answer.status)).toEqual([
        ...[201, 200, 200, 200, 200, 200, 200, 200, 200, 200, 204, 204],
        ...[201, 200, 200, 200, 200, 200, 200, 404, 200, 404, 404, 404],
      ]);

      for (const answer of answers) {
        expect(answer.text).not.toMatch(/deleted/i);

        for (const entry of entriesIn(answer)) {
          expect(Object.keys(entry).sort()).toEqual([
            'content',
            'createdAt',
            'date',
            'id',
          ]);
        }
      }
    });

    it("never contains a deleted entry's content", async () => {
      await as(alice).delete(`/entries/${doomed.id}`).expect(204);

      for (const answer of await everyAnswer()) {
        expect(answer.text).not.toContain(DOOMED_CONTENT);
      }
    });
  });
});
