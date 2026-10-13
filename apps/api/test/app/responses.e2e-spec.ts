import request from 'supertest';
import { as, startApp, stopApp, type RunningApp } from '../support/app';
import { refreshCookieFrom, refreshTokenIn } from '../support/refresh-cookie';

/*
 * What leaves the server. Each response DTO is built field by field and has
 * a unit test of its own, but the compiler does not notice a controller that
 * answers with an entity instead, or a DTO with one field too many. So every
 * route that answers with a body is asked here, before a delete and after
 * one, and every answer is searched for what must never be in it.
 */
describe('what every route answers with (e2e)', () => {
  let running: RunningApp;

  /* A zone no other part of a body could contain by accident. */
  const ZONE = 'Pacific/Kiritimati';
  const PASSWORD = 'a-long-enough-password';
  const DELETED_CONTENT = 'the canal again, and this one goes';

  const SHAPES = {
    entry: ['id', 'content', 'createdAt', 'date'],
    user: ['id', 'email', 'createdAt', 'name'],
    day: ['date', 'mood'],
    session: ['id', 'userId', 'createdAt', 'expiresAt', 'revokedAt'],
  };

  const FORBIDDEN = [
    /time_?zone/i,
    /Kiritimati/,
    /\$argon2/,
    new RegExp(PASSWORD),
    /refreshToken/,
    /passwordHash|password_hash/,
    /"(dayId|day_id|day)"/,
    /deleted/i,
    /user_id/,
  ];

  beforeAll(async () => {
    running = await startApp();
  });

  afterAll(async () => {
    await stopApp(running);
  });

  it('never carries a private field, and carries each shape exactly', async () => {
    const server = running.server;

    const registered = await request(server)
      .post('/auth/register')
      .send({
        email: 'habiba@example.com',
        password: PASSWORD,
        name: 'Habiba',
        timezone: ZONE,
      })
      .expect(201);
    const login = await request(server)
      .post('/auth/login')
      .send({ email: 'habiba@example.com', password: PASSWORD })
      .expect(200);
    const cookie = refreshCookieFrom(login);
    const refreshed = await request(server)
      .post('/auth/refresh')
      .set('Cookie', cookie.pair)
      .expect(200);
    const nextCookie = refreshCookieFrom(refreshed);
    const habiba = as(
      server,
      `Bearer ${(refreshed.body as { accessToken: string }).accessToken}`,
    );

    const kept = await habiba
      .post('/entries')
      .send({ content: 'this one stays' })
      .expect(201);
    const doomed = await habiba
      .post('/entries')
      .send({ content: DELETED_CONTENT })
      .expect(201);
    const keptId = (kept.body as { id: string }).id;
    const doomedId = (doomed.body as { id: string }).id;
    const today = await habiba.get('/days/today').expect(200);
    const { date } = today.body as { date: string };

    const readers = async () => ({
      list: await habiba.get('/entries').expect(200),
      byDate: await habiba.get(`/entries?date=${date}`).expect(200),
      search: await habiba
        .get('/entries?word=one&limit=50&offset=0')
        .expect(200),
      count: await habiba.get('/entries/count').expect(200),
      one: await habiba.get(`/entries/${keptId}`).expect(200),
      edited: await habiba
        .patch(`/entries/${keptId}`)
        .send({ content: 'this one stays, edited' })
        .expect(200),
      range: await habiba.get(`/days?from=${date}&to=${date}`).expect(200),
      day: await habiba.get(`/days/${date}`).expect(200),
      mood: await habiba
        .put(`/days/${date}/mood`)
        .send({ mood: 'Good' })
        .expect(200),
      today: await habiba.get('/days/today').expect(200),
      me: await habiba.get('/auth/me').expect(200),
      sessions: await habiba.get('/auth/sessions').expect(200),
    });

    const before = await readers();

    await habiba.delete(`/entries/${doomedId}`).expect(204);

    const after = {
      ...(await readers()),
      deletedOne: await habiba.get(`/entries/${doomedId}`).expect(404),
      deletedEdit: await habiba
        .patch(`/entries/${doomedId}`)
        .send({ content: 'x' })
        .expect(404),
      deletedAgain: await habiba.delete(`/entries/${doomedId}`).expect(404),
    };

    const everyAnswer: [string, request.Response][] = [
      ['register', registered],
      ['login', login],
      ['refresh', refreshed],
      ['create', kept],
      ['create the doomed one', doomed],
      ['today', today],
      ...Object.entries(before).map(
        ([name, answer]): [string, request.Response] => [
          `${name} before the delete`,
          answer,
        ],
      ),
      ...Object.entries(after).map(
        ([name, answer]): [string, request.Response] => [
          `${name} after the delete`,
          answer,
        ],
      ),
    ];

    for (const [name, answer] of everyAnswer) {
      for (const pattern of FORBIDDEN) {
        expect({ name, text: answer.text }).not.toEqual({
          name,
          text: expect.stringMatching(pattern) as string,
        });
      }
      expect(answer.text).not.toContain(refreshTokenIn(cookie));
      expect(answer.text).not.toContain(refreshTokenIn(nextCookie));
    }

    for (const answer of Object.values(after)) {
      expect(answer.text).not.toContain(DELETED_CONTENT);
    }

    const keysOf = (body: unknown) => Object.keys(body as object);

    for (const answer of [kept, doomed, before.one, before.edited]) {
      expect(keysOf(answer.body)).toEqual(SHAPES.entry);
    }
    for (const answer of [before.list, before.byDate, before.search]) {
      expect((answer.body as object[]).length).toBeGreaterThan(0);
      for (const entry of answer.body as object[]) {
        expect(keysOf(entry)).toEqual(SHAPES.entry);
      }
    }
    expect(before.count.body).toEqual({ count: 2 });
    for (const answer of [today, before.day, before.mood, before.today]) {
      expect(keysOf(answer.body)).toEqual(SHAPES.day);
    }
    expect((before.range.body as object[]).map(keysOf)).toEqual([SHAPES.day]);
    expect(keysOf(registered.body)).toEqual(SHAPES.user);
    expect(keysOf(before.me.body)).toEqual(SHAPES.user);
    for (const answer of [login, refreshed]) {
      expect(keysOf(answer.body)).toEqual(['accessToken', 'user']);
      expect(keysOf((answer.body as { user: object }).user)).toEqual(
        SHAPES.user,
      );
    }
    expect((before.sessions.body as object[]).map(keysOf)).toEqual([
      SHAPES.session,
    ]);
  });
});
