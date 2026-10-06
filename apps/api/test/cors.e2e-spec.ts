import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import { closeTestDataSource, createTestDataSource } from './test-database';

const FOREIGN_ORIGIN = 'http://evil.example';

describe('CORS (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let webOrigin: string;

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

    webOrigin = app.get(ConfigService).getOrThrow<string>('WEB_ORIGIN');
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  it('should be configured with an origin that is not the foreign one', () => {
    expect(webOrigin).toMatch(/^https?:\/\//);
    expect(webOrigin).not.toBe(FOREIGN_ORIGIN);
  });

  describe('a request from the web origin', () => {
    it('should be allowed by name, never by wildcard', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Origin', webOrigin)
        .send({ email: 'nobody@example.com', password: 'whatever-it-is' });

      expect(response.headers['access-control-allow-origin']).toBe(webOrigin);
    });

    it('should be allowed to carry credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Origin', webOrigin)
        .send({ email: 'nobody@example.com', password: 'whatever-it-is' });

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('a request from any other origin', () => {
    it('should not be named in Access-Control-Allow-Origin', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Origin', FOREIGN_ORIGIN)
        .send({ email: 'nobody@example.com', password: 'whatever-it-is' });

      const allowed = response.headers['access-control-allow-origin'] as
        string | undefined;

      expect(allowed).not.toBe(FOREIGN_ORIGIN);
      expect(allowed).not.toBe('*');
    });

    it('should not have its preflight answered in its favour', async () => {
      const response = await request(app.getHttpServer())
        .options('/entries')
        .set('Origin', FOREIGN_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      const allowed = response.headers['access-control-allow-origin'] as
        string | undefined;

      expect(allowed).not.toBe(FOREIGN_ORIGIN);
      expect(allowed).not.toBe('*');
    });
  });

  describe('a preflight for POST /entries with an Authorization header', () => {
    const preflight = () =>
      request(app.getHttpServer())
        .options('/entries')
        .set('Origin', webOrigin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

    it('should succeed without an access token', async () => {
      await preflight().expect(204);
    });

    it('should allow the origin, with credentials', async () => {
      const response = await preflight();

      expect(response.headers['access-control-allow-origin']).toBe(webOrigin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow the POST method', async () => {
      const response = await preflight();

      expect(
        (response.headers['access-control-allow-methods'] ?? '').split(','),
      ).toContain('POST');
    });

    it('should allow the Authorization and Content-Type headers', async () => {
      const response = await preflight();
      const headers = (response.headers['access-control-allow-headers'] ?? '')
        .toLowerCase()
        .split(',');

      expect(headers).toContain('authorization');
      expect(headers).toContain('content-type');
    });
  });

  it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])(
    'should allow the %s method this API uses',
    async (method) => {
      const response = await request(app.getHttpServer())
        .options('/entries')
        .set('Origin', webOrigin)
        .set('Access-Control-Request-Method', method);

      expect(
        (response.headers['access-control-allow-methods'] ?? '').split(','),
      ).toContain(method);
    },
  );
});
