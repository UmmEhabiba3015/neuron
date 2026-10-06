import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import { REFRESH_COOKIE_NAME } from './../src/auth/refresh-cookie';
import { Session } from './../src/auth/session.entity';
import {
  refreshCookieFrom,
  refreshTokenIn,
  type RefreshCookie,
} from './refresh-cookie';
import { closeTestDataSource, createTestDataSource } from './test-database';

interface LoginBody {
  accessToken: string;
  user: { id: string };
}

interface Login extends LoginBody {
  cookie: RefreshCookie;
}

describe('sessions and revocation (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const credentials = {
    email: 'umer@example.com',
    password: 'a-long-enough-password',
  };

  const login = async (): Promise<Login> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    return {
      ...(response.body as LoginBody),
      cookie: refreshCookieFrom(response),
    };
  };

  const refreshWith = (cookie: RefreshCookie) =>
    request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookie.pair);

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

  describe('login', () => {
    it('should return an access token and set a refresh cookie', async () => {
      const body = await login();

      expect(typeof body.accessToken).toBe('string');
      expect(refreshTokenIn(body.cookie)).not.toBe('');
    });

    it('should create one session row per login', async () => {
      await login();
      await login();

      expect(await dataSource.getRepository(Session).count()).toBe(2);
    });

    it('should store a hash of the refresh token, never the token', async () => {
      const body = await login();

      const [session] = await dataSource.getRepository(Session).find();

      const refreshToken = refreshTokenIn(body.cookie);

      expect(session.refreshTokenHash).not.toBe(refreshToken);
      expect(session.refreshTokenHash).not.toContain(refreshToken);
      expect(session.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should never put a refresh token hash in a response body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      expect(JSON.stringify(response.body)).not.toContain('refreshTokenHash');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should exchange a refresh cookie for a new access token', async () => {
      const body = await login();

      const refreshed = await refreshWith(body.cookie).expect(200);

      const next = refreshed.body as LoginBody;

      expect(typeof next.accessToken).toBe('string');
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${next.accessToken}`)
        .expect(200);
    });

    it('should rotate the refresh token on every use', async () => {
      const body = await login();

      const refreshed = await refreshWith(body.cookie).expect(200);
      const next = refreshCookieFrom(refreshed);

      expect(refreshTokenIn(next)).not.toBe(refreshTokenIn(body.cookie));
      await refreshWith(next).expect(200);
    });

    it('should reject a refresh cookie that has already been rotated', async () => {
      const body = await login();

      await refreshWith(body.cookie).expect(200);

      await refreshWith(body.cookie).expect(401);
    });

    it('should revoke every session for the user when a rotated cookie is replayed', async () => {
      const first = await login();
      const second = await login();

      const rotated = refreshCookieFrom(
        await refreshWith(first.cookie).expect(200),
      );

      await refreshWith(first.cookie).expect(401);

      const sessions = await dataSource.getRepository(Session).find();

      expect(sessions).toHaveLength(2);
      expect(sessions.every((session) => session.revokedAt !== null)).toBe(
        true,
      );
      await refreshWith(rotated).expect(401);
      await refreshWith(second.cookie).expect(401);
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${second.accessToken}`)
        .expect(401);
    });

    it('should reject a refresh token for an unknown session', async () => {
      const body = await login();

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set(
          'Cookie',
          `${REFRESH_COOKIE_NAME}=00000000-0000-0000-0000-000000000000.${refreshTokenIn(body.cookie)}`,
        )
        .expect(401);
    });

    it('should be reachable without an access token', async () => {
      const body = await login();

      await refreshWith(body.cookie).expect(200);
    });
  });

  describe('POST /auth/logout', () => {
    it('should stop the session obtaining new access tokens', async () => {
      const body = await login();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(204);

      await refreshWith(body.cookie).expect(401);
    });

    it('should reject the access token it was issued with, immediately', async () => {
      const body = await login();

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(401);
    });

    it('should leave the other device signed in', async () => {
      const laptop = await login();
      const phone = await login();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${laptop.accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${laptop.accessToken}`)
        .expect(401);
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${phone.accessToken}`)
        .expect(200);
    });
  });

  describe('POST /auth/logout-everywhere', () => {
    it('should revoke every session including other devices', async () => {
      const laptop = await login();
      const phone = await login();

      await request(app.getHttpServer())
        .post('/auth/logout-everywhere')
        .set('Authorization', `Bearer ${phone.accessToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${laptop.accessToken}`)
        .expect(401);
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${phone.accessToken}`)
        .expect(401);
    });
  });

  describe('GET /auth/sessions', () => {
    it('should list the active sessions and exclude revoked ones', async () => {
      const laptop = await login();
      const phone = await login();

      const before = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${phone.accessToken}`)
        .expect(200);

      expect((before.body as unknown[]).length).toBe(2);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${laptop.accessToken}`)
        .expect(204);

      const after = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${phone.accessToken}`)
        .expect(200);

      expect((after.body as unknown[]).length).toBe(1);
    });

    it('should never expose the refresh token hash', async () => {
      const body = await login();

      const response = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      expect(JSON.stringify(response.body)).not.toContain('refreshTokenHash');
      expect(Object.keys((response.body as object[])[0]).sort()).toEqual([
        'createdAt',
        'expiresAt',
        'id',
        'revokedAt',
        'userId',
      ]);
    });
  });
});
