import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { REFRESH_TOKEN_LIFETIME_DAYS } from './../src/auth/auth.service';
import { REFRESH_COOKIE_NAME } from './../src/auth/refresh-cookie';
import { Session } from './../src/auth/session.entity';
import { configureHttp } from './../src/configure-http';
import { refreshCookieFrom, refreshTokenIn } from './refresh-cookie';
import { closeTestDataSource, createTestDataSource } from './test-database';

describe('the refresh cookie (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const credentials = {
    email: 'umer@example.com',
    password: 'a-long-enough-password',
  };

  const login = () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

  const refresh = (cookie?: string) => {
    const call = request(app.getHttpServer()).post('/auth/refresh');

    return cookie === undefined ? call : call.set('Cookie', cookie);
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

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  /*
   * Each attribute has its own test on purpose. One assertion on the whole
   * header would fail for any of them and say nothing about which.
   */
  describe.each([
    ['login', () => login()],
    [
      'refresh',
      async () => refresh(refreshCookieFrom(await login()).pair).expect(200),
    ],
  ])('the cookie set by %s', (_route, respond) => {
    it('should be HttpOnly', async () => {
      expect(refreshCookieFrom(await respond()).attributes).toContain(
        'HttpOnly',
      );
    });

    it('should be SameSite=Strict', async () => {
      expect(refreshCookieFrom(await respond()).attributes).toContain(
        'SameSite=Strict',
      );
    });

    it('should be scoped to Path=/auth/refresh', async () => {
      expect(refreshCookieFrom(await respond()).attributes).toContain(
        'Path=/auth/refresh',
      );
    });

    it("should live exactly as long as the refresh token's session", async () => {
      const seconds = REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60;

      expect(refreshCookieFrom(await respond()).attributes).toContain(
        `Max-Age=${seconds}`,
      );
    });

    it('should not be Secure until HTTPS exists', async () => {
      expect(refreshCookieFrom(await respond()).attributes).not.toContain(
        'Secure',
      );
    });

    it('should carry the session id and a token that matches the stored hash', async () => {
      const cookie = refreshCookieFrom(await respond());
      const [session] = await dataSource.getRepository(Session).find();

      expect(cookie.value.startsWith(`${session.id}.`)).toBe(true);
      expect(refreshTokenIn(cookie)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('should keep the refresh token out of the response body', async () => {
      const response = await respond();
      const cookie = refreshCookieFrom(response);

      expect(JSON.stringify(response.body)).not.toContain(
        refreshTokenIn(cookie),
      );
      expect(Object.keys(response.body as object).sort()).toEqual([
        'accessToken',
        'user',
      ]);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should succeed with the cookie and nothing else', async () => {
      const cookie = refreshCookieFrom(await login());

      const response = await refresh(cookie.pair).expect(200);

      expect(
        typeof (response.body as { accessToken: string }).accessToken,
      ).toBe('string');
    });

    it('should ignore a refresh token sent in the body', async () => {
      const cookie = refreshCookieFrom(await login());
      const [session] = await dataSource.getRepository(Session).find();

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ sessionId: session.id, refreshToken: refreshTokenIn(cookie) })
        .expect(401);
    });

    it('should answer every bad cookie with the same 401', async () => {
      const cookie = refreshCookieFrom(await login());
      const [session] = await dataSource.getRepository(Session).find();

      const responses = [
        await refresh(),
        await refresh('some_other_cookie=value'),
        await refresh(`${REFRESH_COOKIE_NAME}=`),
        await refresh(`${REFRESH_COOKIE_NAME}=no-separator-in-this-value`),
        await refresh(`${REFRESH_COOKIE_NAME}=${session.id}.`),
        await refresh(`${REFRESH_COOKIE_NAME}=.${refreshTokenIn(cookie)}`),
        await refresh(
          `${REFRESH_COOKIE_NAME}=00000000-0000-0000-0000-000000000000.${refreshTokenIn(cookie)}`,
        ),
        await refresh(`${REFRESH_COOKIE_NAME}=${session.id}.not-the-token`),
      ];

      for (const response of responses) {
        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          statusCode: 401,
          message: 'Invalid or expired session',
          error: 'Unauthorized',
        });
        expect(response.headers['set-cookie']).toBeUndefined();
      }
    });
  });

  describe.each(['/auth/logout', '/auth/logout-everywhere'])(
    'POST %s',
    (route) => {
      it('should clear the cookie on the path it was set with', async () => {
        const loggedIn = await login();
        const { accessToken } = loggedIn.body as { accessToken: string };

        const response = await request(app.getHttpServer())
          .post(route)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);

        const cleared = refreshCookieFrom(response);

        expect(cleared.value).toBe('');
        expect(cleared.attributes).toContain('Path=/auth/refresh');
        expect(cleared.attributes).toContain(
          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        );
      });
    },
  );
});
