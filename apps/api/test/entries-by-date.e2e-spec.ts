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
 * GET /entries?date=YYYY-MM-DD -- the entries that belong to one day.
 *
 * Every entry here is written through the API with the clock set, rather
 * than inserted with a day_id chosen by the test. The claim is about which
 * day the application files an entry under, so the application has to be the
 * one that files it.
 */
describe('entries for one day (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let alice: string;
  let bob: string;

  /*
   * Moving the clock expires the token in hand, so each write signs in again
   * at the instant it is made.
   */
  const writeAt = async (who: string, instant: string, content: string) => {
    moveClockTo(instant);

    const response = await request(app.getHttpServer())
      .post('/entries')
      .set('Authorization', await login(app.getHttpServer(), who))
      .send({ content })
      .expect(201);

    return response.body as { id: string; content: string };
  };

  const contentsOf = async (auth: string, query: string): Promise<string[]> => {
    const response = await request(app.getHttpServer())
      .get(`/entries${query}`)
      .set('Authorization', auth)
      .expect(200);

    return (response.body as { content: string }[]).map(
      (entry) => entry.content,
    );
  };

  const countOf = async (auth: string, query: string): Promise<number> => {
    const response = await request(app.getHttpServer())
      .get(`/entries/count${query}`)
      .set('Authorization', auth)
      .expect(200);

    return (response.body as { count: number }).count;
  };

  /*
   * Each write below signs in again, and signing in verifies a password
   * hash that is slow on purpose. Ten of them do not fit in Jest's default
   * five seconds when the other suites are running beside this one.
   */
  const SETUP_TIMEOUT_MS = 30_000;

  beforeEach(async () => {
    freezeClockAt('2026-08-07T12:00:00.000Z');

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

    await authenticate(app.getHttpServer(), 'alice');
    await authenticate(app.getHttpServer(), 'bob');

    /*
     * Alice writes on four days and Bob on one of them. The 9th is the day
     * under test; the 7th, 8th and 10th are there so that "only" has
     * something to exclude.
     */
    await writeAt('alice', '2026-08-07T12:00:00.000Z', 'two days before');
    await writeAt('alice', '2026-08-08T12:00:00.000Z', 'the day before');
    await writeAt('alice', '2026-08-09T10:00:00.000Z', 'the morning');
    await writeAt('bob', '2026-08-09T11:00:00.000Z', "bob's, the same date");
    await writeAt('alice', '2026-08-09T22:00:00.000Z', 'the evening');
    await writeAt('alice', '2026-08-10T12:00:00.000Z', 'the day after');

    alice = await login(app.getHttpServer(), 'alice');
    bob = await login(app.getHttpServer(), 'bob');
  }, SETUP_TIMEOUT_MS);

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  it('returns the entries of that day and only those, newest first', async () => {
    expect(await contentsOf(alice, '?date=2026-08-09')).toEqual([
      'the evening',
      'the morning',
    ]);
  });

  it('answers each other day with its own entries', async () => {
    expect(await contentsOf(alice, '?date=2026-08-07')).toEqual([
      'two days before',
    ]);
    expect(await contentsOf(alice, '?date=2026-08-08')).toEqual([
      'the day before',
    ]);
    expect(await contentsOf(alice, '?date=2026-08-10')).toEqual([
      'the day after',
    ]);
  });

  /*
   * The day ends at 4am. Both entries carry a created_at on the 12th, so a
   * filter that compared created_at against midnight would put both on the
   * 12th and this would fail.
   */
  it('puts 03:59 on the previous date and 04:01 on the current one', async () => {
    await writeAt('alice', '2026-08-12T03:59:00.000Z', 'still last night');
    await writeAt('alice', '2026-08-12T04:01:00.000Z', 'the new day');

    alice = await login(app.getHttpServer(), 'alice');

    expect(await contentsOf(alice, '?date=2026-08-11')).toEqual([
      'still last night',
    ]);
    expect(await contentsOf(alice, '?date=2026-08-12')).toEqual([
      'the new day',
    ]);
  });

  it("never returns another user's entries from the same date", async () => {
    expect(await contentsOf(alice, '?date=2026-08-09')).not.toContain(
      "bob's, the same date",
    );
    expect(await contentsOf(bob, '?date=2026-08-09')).toEqual([
      "bob's, the same date",
    ]);
  });

  it('answers a date the caller did not write on with an empty array', async () => {
    expect(await contentsOf(alice, '?date=2026-08-01')).toEqual([]);
    expect(await contentsOf(bob, '?date=2026-08-10')).toEqual([]);
  });

  it('combines with word', async () => {
    expect(await contentsOf(alice, '?date=2026-08-09&word=morn')).toEqual([
      'the morning',
    ]);

    /*
     * "the day" matches on the 8th and the 10th and not on the 9th, so the
     * date is still narrowing when a word is present.
     */
    expect(await contentsOf(alice, '?word=the day')).toHaveLength(2);
    expect(await contentsOf(alice, '?date=2026-08-09&word=the day')).toEqual(
      [],
    );
  });

  it('combines with limit and offset', async () => {
    expect(await contentsOf(alice, '?date=2026-08-09&limit=1')).toEqual([
      'the evening',
    ]);
    expect(
      await contentsOf(alice, '?date=2026-08-09&limit=1&offset=1'),
    ).toEqual(['the morning']);
    expect(
      await contentsOf(alice, '?date=2026-08-09&limit=1&offset=2'),
    ).toEqual([]);
  });

  it('counts the entries of that day, for the caller', async () => {
    expect(await countOf(alice, '?date=2026-08-09')).toBe(2);
    expect(await countOf(bob, '?date=2026-08-09')).toBe(1);
    expect(await countOf(alice, '?date=2026-08-01')).toBe(0);
    expect(await countOf(alice, '')).toBe(5);
  });

  it('still returns an entry as id, content and createdAt, and no day', async () => {
    const response = await request(app.getHttpServer())
      .get('/entries?date=2026-08-09')
      .set('Authorization', alice)
      .expect(200);

    for (const entry of response.body as object[]) {
      expect(Object.keys(entry).sort()).toEqual(['content', 'createdAt', 'id']);
    }
  });

  /*
   * This used to take an entry's day away and show that no ?date= reached
   * it afterwards. Since RequireEntryDay the database refuses to take the
   * day away, so the entry that no date could find can no longer be made.
   * What is left to claim is the refusal, and that the entry is still where
   * it was.
   */
  it('cannot have its day taken away, so it stays under its date', async () => {
    await expect(
      dataSource.query(
        `UPDATE entries SET day_id = NULL WHERE content = 'the morning'`,
      ),
    ).rejects.toThrow('NOT NULL constraint failed: entries.day_id');

    expect(await contentsOf(alice, '?date=2026-08-09')).toEqual([
      'the evening',
      'the morning',
    ]);
    expect(await countOf(alice, '?date=2026-08-09')).toBe(2);
  });

  it.each([
    ['a month that does not exist', '?date=2026-13-45'],
    ['a day that does not exist', '?date=2026-02-31'],
    ['a word', '?date=yesterday'],
    ['an instant', '?date=2026-08-09T10:00:00.000Z'],
    ['an empty date', '?date='],
    ['a date given twice', '?date=2026-08-09&date=2026-08-10'],
    ['a misspelled parameter', '?dat=2026-08-09'],
  ])('refuses %s on the listing and on the count', async (_label, query) => {
    await request(app.getHttpServer())
      .get(`/entries${query}`)
      .set('Authorization', alice)
      .expect(400);

    await request(app.getHttpServer())
      .get(`/entries/count${query}`)
      .set('Authorization', alice)
      .expect(400);
  });
});
