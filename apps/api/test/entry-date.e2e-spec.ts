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

type EntryAnswer = Record<string, unknown> & { id: string };

/*
 * Every answer that holds an entry says which day the entry is on. The date
 * is the one stored on the day row the entry points at. Every test here
 * asks over HTTP, and compares the whole answer, so a field that should not
 * be there fails the same test as a field that is missing.
 */
describe('the date an entry is on (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const as = (authorization: string) => {
    const server = app.getHttpServer();

    return {
      post: (content: string) =>
        request(server)
          .post('/entries')
          .set('Authorization', authorization)
          .send({ content }),
      get: (path: string) =>
        request(server).get(path).set('Authorization', authorization),
      patch: (id: string, content: string) =>
        request(server)
          .patch(`/entries/${id}`)
          .set('Authorization', authorization)
          .send({ content }),
    };
  };

  /*
   * Signs in after the clock has moved. An access token lasts fifteen
   * minutes, so one from before a jump is expired after it.
   */
  const at = async (instant: string, who: string) => {
    moveClockTo(instant);

    return as(await login(app.getHttpServer(), who));
  };

  const userIdOf = async (who: string): Promise<string> => {
    const [{ id }] = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM users WHERE email = ?`,
      [`${who}@example.com`],
    );

    return id;
  };

  /*
   * The five routes that answer with an entry. Each takes the id of an entry
   * that exists and answers with the entries in its response: one for most,
   * a list for the two listings.
   */
  const ROUTES: [
    string,
    (
      caller: ReturnType<typeof as>,
      id: string,
      date: string,
    ) => Promise<EntryAnswer[]>,
  ][] = [
    [
      'POST /entries',
      async (caller) => [
        (await caller.post('a second one').expect(201)).body as EntryAnswer,
      ],
    ],
    [
      'GET /entries',
      async (caller) =>
        (await caller.get('/entries').expect(200)).body as EntryAnswer[],
    ],
    [
      'GET /entries?date=',
      async (caller, _id, date) =>
        (await caller.get(`/entries?date=${date}`).expect(200))
          .body as EntryAnswer[],
    ],
    [
      'GET /entries/:id',
      async (caller, id) => [
        (await caller.get(`/entries/${id}`).expect(200)).body as EntryAnswer,
      ],
    ],
    [
      'PATCH /entries/:id',
      async (caller, id) => [
        (await caller.patch(id, 'edited').expect(200)).body as EntryAnswer,
      ],
    ],
  ];

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
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  describe('on every route that answers with an entry', () => {
    let alice: ReturnType<typeof as>;
    let written: EntryAnswer;

    beforeEach(async () => {
      alice = as(await authenticate(app.getHttpServer(), 'alice'));
      written = (await alice.post('written at noon').expect(201))
        .body as EntryAnswer;
    });

    it.each(ROUTES)('%s answers with the date', async (_route, ask) => {
      const entries = await ask(alice, written.id, '2026-08-09');

      expect(entries.length).toBeGreaterThan(0);

      for (const entry of entries) {
        expect(entry.date).toBe('2026-08-09');
      }
    });

    /*
     * The compiler does not notice an extra field on an answer, so this
     * does. The four names are the ones that must never leave the server,
     * in the spelling the code uses and in the spelling the database uses.
     */
    it.each(ROUTES)(
      '%s answers with id, content, createdAt and date, and nothing else',
      async (_route, ask) => {
        const entries = await ask(alice, written.id, '2026-08-09');

        expect(entries.length).toBeGreaterThan(0);

        for (const entry of entries) {
          expect(Object.keys(entry).sort()).toEqual([
            'content',
            'createdAt',
            'date',
            'id',
          ]);

          for (const forbidden of [
            'dayId',
            'day',
            'userId',
            'deletedAt',
            'day_id',
            'user_id',
            'deleted_at',
          ]) {
            expect(entry).not.toHaveProperty(forbidden);
          }
        }
      },
    );

    it('answers with the whole entry, and the date is text in YYYY-MM-DD form', () => {
      expect(written).toEqual({
        id: written.id,
        content: 'written at noon',
        createdAt: '2026-08-09T12:00:00.000Z',
        date: '2026-08-09',
      });
    });
  });

  it('answers with two different dates for two entries on two days, in one GET /entries', async () => {
    await authenticate(app.getHttpServer(), 'alice');

    await (
      await at('2026-08-09T12:00:00.000Z', 'alice')
    )
      .post('on the ninth')
      .expect(201);
    const later = await at('2026-08-10T12:00:00.000Z', 'alice');
    await later.post('on the tenth').expect(201);

    const listed = (await later.get('/entries').expect(200)).body as {
      content: string;
      date: string;
    }[];

    expect(listed.map(({ content, date }) => ({ content, date }))).toEqual([
      { content: 'on the tenth', date: '2026-08-10' },
      { content: 'on the ninth', date: '2026-08-09' },
    ]);
  });

  /*
   * The entry is put straight into the database, the way one written before
   * Day 17b sits there: created at 02:00Z on the 10th and filed under the
   * 9th, because a day then ended at 04:00 UTC. Midnight in UTC, applied to
   * its created_at today, would say the 10th.
   */
  describe('an entry filed under a date that its created_at would not give today', () => {
    let alice: ReturnType<typeof as>;

    beforeEach(async () => {
      alice = as(await authenticate(app.getHttpServer(), 'alice'));
      const aliceId = await userIdOf('alice');

      await dataSource.query(
        `INSERT INTO days (id, date, mood, created_at, user_id)
         VALUES ('the-9th', '2026-08-09', NULL, '2026-08-09T10:00:00.000Z', ?)`,
        [aliceId],
      );
      await dataSource.query(
        `INSERT INTO entries (id, content, created_at, user_id, day_id)
         VALUES ('e-late', 'after midnight', '2026-08-10T02:00:00.000Z', ?, 'the-9th')`,
        [aliceId],
      );
    });

    it.each(ROUTES.filter(([route]) => route !== 'POST /entries'))(
      '%s answers with the stored date',
      async (_route, ask) => {
        const entries = await ask(alice, 'e-late', '2026-08-09');

        expect(entries).toHaveLength(1);
        expect(entries[0]).toEqual({
          id: 'e-late',
          content: expect.any(String) as string,
          createdAt: '2026-08-10T02:00:00.000Z',
          date: '2026-08-09',
        });
      },
    );
  });

  /*
   * 05:00Z on 8 October is 22:00 on the 7th in Los Angeles. So the entry's
   * createdAt starts with 2026-10-08 and its date is 2026-10-07: the two
   * disagree, and the date is the one to believe.
   */
  describe('an entry written in a zone that is behind UTC', () => {
    const instant = '2026-10-08T05:00:00.000Z';

    beforeEach(async () => {
      await authenticate(
        app.getHttpServer(),
        'los-angeles',
        'America/Los_Angeles',
      );
    });

    it('answers POST /entries with the date of the day it was filed on, not the date in createdAt', async () => {
      const created = (
        await (
          await at(instant, 'los-angeles')
        )
          .post('ten at night')
          .expect(201)
      ).body as EntryAnswer;

      expect(created).toEqual({
        id: created.id,
        content: 'ten at night',
        createdAt: instant,
        date: '2026-10-07',
      });
    });

    /*
     * The stored timezone changes after the entry is written. Anything that
     * worked the date out again, from created_at and the timezone the
     * person has now, would answer the 8th.
     */
    it.each(ROUTES.filter(([route]) => route !== 'POST /entries'))(
      '%s still answers with that date after the timezone of the user changes',
      async (_route, ask) => {
        const created = (
          await (
            await at(instant, 'los-angeles')
          )
            .post('ten at night')
            .expect(201)
        ).body as EntryAnswer;

        await dataSource.query(
          `UPDATE users SET timezone = 'Asia/Tokyo' WHERE email = 'los-angeles@example.com'`,
        );

        const entries = await ask(
          await at(instant, 'los-angeles'),
          created.id,
          '2026-10-07',
        );

        expect(entries).toHaveLength(1);
        expect(entries[0].date).toBe('2026-10-07');
      },
    );
  });

  /*
   * The dates must not cost one query for each entry. The same listing is
   * asked for with one entry in it and with thirty on thirty days, and the
   * database is sent the same number of statements both times.
   */
  describe('how many queries a listing runs', () => {
    /*
     * SQLite has one connection, and TypeORM sends every statement through
     * one query runner for it. Watching that runner sees every statement
     * the request causes, whichever part of the application sent it.
     */
    const queriesDuring = async (ask: () => Promise<unknown>) => {
      const spy = jest.spyOn(dataSource.createQueryRunner(), 'query');

      try {
        await ask();

        return spy.mock.calls.map(([sql]) => sql);
      } finally {
        spy.mockRestore();
      }
    };

    /*
     * The other twenty-nine are put straight into the database, each on its
     * own day. Writing them through the API would mean signing in again for
     * every date, and thirty password checks are slow enough to time out.
     */
    it('runs one query on entries, and the same number in all, for one entry and for thirty', async () => {
      const alice = as(await authenticate(app.getHttpServer(), 'alice'));
      await alice.post('day 9').expect(201);

      const forOne = await queriesDuring(() =>
        alice.get('/entries').expect(200),
      );

      await seedEntries(
        dataSource,
        Array.from({ length: 29 }, (_unused, index) => {
          const day = String(index + 1).padStart(2, '0');

          return {
            id: `seeded-${day}`,
            content: `July ${day}`,
            createdAt: `2026-07-${day}T12:00:00.000Z`,
          };
        }),
        await userIdOf('alice'),
      );

      let listed: { date: string }[] = [];
      const forThirty = await queriesDuring(async () => {
        listed = (await alice.get('/entries').expect(200)).body as {
          date: string;
        }[];
      });

      expect(new Set(listed.map((entry) => entry.date)).size).toBe(30);

      const onEntries = (queries: string[]) =>
        queries.filter((sql) => /FROM "entries"/.test(sql));

      expect(onEntries(forOne)).toHaveLength(1);
      expect(onEntries(forThirty)).toHaveLength(1);
      expect(forThirty).toHaveLength(forOne.length);
      expect(forThirty.filter((sql) => /"days"/.test(sql))).toHaveLength(1);
    });
  });
});
