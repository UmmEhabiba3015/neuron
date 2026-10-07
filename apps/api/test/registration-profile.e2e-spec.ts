import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import { refreshCookieFrom } from './refresh-cookie';
import { closeTestDataSource, createTestDataSource } from './test-database';

/*
 * The name and the timezone an account is created with: what is accepted,
 * what is stored, and what is sent back.
 */
describe('the name and the timezone at registration (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const valid = {
    email: 'habiba@example.com',
    password: 'a-long-enough-password',
    name: 'Habiba',
    timezone: 'Asia/Karachi',
  };

  const register = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/auth/register').send(body);

  const without = (field: keyof typeof valid): Record<string, unknown> => {
    const body: Record<string, unknown> = { ...valid };
    delete body[field];

    return body;
  };

  const storedUsers = () =>
    dataSource.query<{ name: string; timezone: string }[]>(
      `SELECT name, timezone FROM users`,
    );

  const messagesFrom = (response: request.Response): string[] =>
    (response.body as { message: string[] }).message;

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
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  describe('the timezone', () => {
    /*
     * Intl accepts every one of the first four. The fourth is an offset and
     * is refused all the same. The stored column is the name Intl answers
     * with, and not the spelling that was sent.
     */
    it.each([
      ['Asia/Karachi', 'Asia/Karachi'],
      ['asia/karachi', 'Asia/Karachi'],
      ['EST', 'America/Panama'],
    ])('accepts %s and stores it as %s', async (sent, stored) => {
      await register({ ...valid, timezone: sent }).expect(201);

      expect(await storedUsers()).toEqual([
        { name: 'Habiba', timezone: stored },
      ]);
    });

    it.each([
      ['an offset', '+05:00'],
      ['an offset without a colon', '-0500'],
      ['a zone that does not exist', 'Mars/Olympus'],
      ['an empty string', ''],
      ['a country', 'Pakistan'],
      ['a number', 5],
      ['null', null],
    ])('refuses %s with a 400 and creates no account', async (_label, sent) => {
      const response = await register({ ...valid, timezone: sent }).expect(400);

      expect(messagesFrom(response)).toEqual([
        'timezone must be an IANA time zone name such as Asia/Karachi',
      ]);
      expect(await storedUsers()).toEqual([]);
    });

    it('refuses a body with no timezone, and does not fall back to one', async () => {
      const response = await register(without('timezone')).expect(400);

      expect(messagesFrom(response)).toEqual([
        'timezone must be an IANA time zone name such as Asia/Karachi',
      ]);
      expect(await storedUsers()).toEqual([]);
    });
  });

  describe('the name', () => {
    it('is trimmed at both ends, in the answer and in the database', async () => {
      const response = await register({
        ...valid,
        name: '  Habiba  ',
      }).expect(201);

      expect((response.body as { name: string }).name).toBe('Habiba');
      expect((await storedUsers())[0].name).toBe('Habiba');
    });

    it('keeps the spaces inside it', async () => {
      await register({ ...valid, name: ' Umm e  Habiba ' }).expect(201);

      expect((await storedUsers())[0].name).toBe('Umm e  Habiba');
    });

    it.each([
      ['only spaces', '   '],
      ['only a tab and a line break', '\t\n'],
      ['empty', ''],
    ])('refuses a name that is %s', async (_label, name) => {
      const response = await register({ ...valid, name }).expect(400);

      expect(messagesFrom(response)).toEqual([
        'name must contain at least one character that is not whitespace',
      ]);
      expect(await storedUsers()).toEqual([]);
    });

    /*
     * The 60 is written out here and not imported, so that this still says
     * what the product expects if the contract's number is changed by
     * mistake.
     */
    it('accepts 60 characters', async () => {
      await register({ ...valid, name: 'a'.repeat(60) }).expect(201);

      expect((await storedUsers())[0].name).toHaveLength(60);
    });

    it('refuses 61 characters', async () => {
      const response = await register({
        ...valid,
        name: 'a'.repeat(61),
      }).expect(400);

      expect(messagesFrom(response)).toEqual([
        'name must be shorter than or equal to 60 characters',
      ]);
      expect(await storedUsers()).toEqual([]);
    });

    it('counts the 60 after trimming, not before', async () => {
      await register({ ...valid, name: `  ${'a'.repeat(60)}  ` }).expect(201);

      expect((await storedUsers())[0].name).toBe('a'.repeat(60));
    });

    it('refuses a body with no name', async () => {
      await register(without('name')).expect(400);

      expect(await storedUsers()).toEqual([]);
    });

    it('refuses a name that is not a string', async () => {
      await register({ ...valid, name: 42 }).expect(400);

      expect(await storedUsers()).toEqual([]);
    });

    it('is not what an account is identified by: two people may share one', async () => {
      await register(valid).expect(201);
      await register({ ...valid, email: 'another@example.com' }).expect(201);

      expect(await storedUsers()).toHaveLength(2);
    });
  });

  it('still answers 409, with the same message, for an email already registered', async () => {
    await register(valid).expect(201);

    const response = await register({ ...valid, name: 'Someone else' }).expect(
      409,
    );

    expect((response.body as { message: string }).message).toBe(
      'That email address is already registered',
    );
  });

  /*
   * WireUser has no timezone, and the controllers hand back the entity. The
   * compiler does not object to an extra field, so this does.
   *
   * The zone is one no other part of these bodies could contain by
   * accident, and each body is searched for the word and for the value.
   */
  describe('what is sent back', () => {
    const zone = 'Pacific/Kiritimati';
    const account = { ...valid, timezone: zone };

    const expectNoTimezoneIn = (body: unknown) => {
      const text = JSON.stringify(body);

      expect(text).not.toMatch(/time_?zone/i);
      expect(text).not.toContain(zone);
      expect(text).not.toContain('Kiritimati');
    };

    const signIn = async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: account.email, password: account.password })
        .expect(200);

      return {
        response,
        authorization: `Bearer ${(response.body as { accessToken: string }).accessToken}`,
        cookie: refreshCookieFrom(response),
      };
    };

    it('carries the name, and no timezone, from register', async () => {
      const response = await register(account).expect(201);

      expect(Object.keys(response.body as object).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'name',
      ]);
      expect((response.body as { name: string }).name).toBe('Habiba');
      expectNoTimezoneIn(response.body);
    });

    it('carries the name, and no timezone, from login', async () => {
      await register(account).expect(201);
      const { response } = await signIn();

      expect(
        Object.keys((response.body as { user: object }).user).sort(),
      ).toEqual(['createdAt', 'email', 'id', 'name']);
      expect((response.body as { user: { name: string } }).user.name).toBe(
        'Habiba',
      );
      expectNoTimezoneIn(response.body);
    });

    it('carries the name, and no timezone, from refresh', async () => {
      await register(account).expect(201);
      const { cookie } = await signIn();

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookie.pair)
        .expect(200);

      expect(
        Object.keys((response.body as { user: object }).user).sort(),
      ).toEqual(['createdAt', 'email', 'id', 'name']);
      expect((response.body as { user: { name: string } }).user.name).toBe(
        'Habiba',
      );
      expectNoTimezoneIn(response.body);
    });

    it('carries the name, and no timezone, from GET /auth/me', async () => {
      await register(account).expect(201);
      const { authorization } = await signIn();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', authorization)
        .expect(200);

      expect(Object.keys(response.body as object).sort()).toEqual([
        'createdAt',
        'email',
        'id',
        'name',
      ]);
      expect((response.body as { name: string }).name).toBe('Habiba');
      expectNoTimezoneIn(response.body);
    });

    it('carries no timezone from any other route that answers with a body', async () => {
      await register(account).expect(201);
      const { authorization } = await signIn();
      const server = app.getHttpServer();
      const as = (call: request.Test) =>
        call.set('Authorization', authorization);

      const created = await as(
        request(server).post('/entries').send({ content: 'something' }),
      ).expect(201);
      const { id } = created.body as { id: string };

      const today = await as(request(server).get('/days/today')).expect(200);
      const { date } = today.body as { date: string };

      const answers = [
        created,
        today,
        await as(request(server).get('/entries')).expect(200),
        await as(request(server).get('/entries/count')).expect(200),
        await as(request(server).get(`/entries/${id}`)).expect(200),
        await as(
          request(server).patch(`/entries/${id}`).send({ content: 'changed' }),
        ).expect(200),
        await as(request(server).get(`/days?from=${date}&to=${date}`)).expect(
          200,
        ),
        await as(request(server).get(`/days/${date}`)).expect(200),
        await as(
          request(server).put(`/days/${date}/mood`).send({ mood: 'Good' }),
        ).expect(200),
        await as(request(server).get('/auth/sessions')).expect(200),
      ];

      for (const answer of answers) {
        expectNoTimezoneIn(answer.body);
      }
    });
  });
});
