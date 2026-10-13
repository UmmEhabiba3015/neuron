import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { startApp, stopApp, type RunningApp } from '../support/app';

const FOREIGN_ORIGIN = 'http://evil.example';

/*
 * The web app runs on another origin, so the browser asks before it lets a
 * page read this API. Only WEB_ORIGIN is answered in its favour, by name and
 * with credentials, because the refresh cookie has to travel.
 */
describe('CORS (e2e)', () => {
  let running: RunningApp;
  let webOrigin: string;

  const preflight = (origin: string, method = 'POST') =>
    request(running.server)
      .options('/entries')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', method)
      .set('Access-Control-Request-Headers', 'authorization,content-type');

  beforeAll(async () => {
    running = await startApp();
    webOrigin = running.app.get(ConfigService).getOrThrow<string>('WEB_ORIGIN');
  });

  afterAll(async () => {
    await stopApp(running);
  });

  it('lets the web origin in by name, with credentials, for every method and header the app uses', async () => {
    expect(webOrigin).toMatch(/^https?:\/\//);
    expect(webOrigin).not.toBe(FOREIGN_ORIGIN);

    const simple = await request(running.server)
      .post('/auth/login')
      .set('Origin', webOrigin)
      .send({ email: 'nobody@example.com', password: 'whatever-it-is' });

    expect(simple.headers['access-control-allow-origin']).toBe(webOrigin);
    expect(simple.headers['access-control-allow-credentials']).toBe('true');

    /* No access token: a preflight never carries one. */
    const asked = await preflight(webOrigin).expect(204);

    expect(asked.headers['access-control-allow-origin']).toBe(webOrigin);
    expect(asked.headers['access-control-allow-credentials']).toBe('true');
    expect(
      (asked.headers['access-control-allow-headers'] ?? '')
        .toLowerCase()
        .split(','),
    ).toEqual(expect.arrayContaining(['authorization', 'content-type']));

    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      const response = await preflight(webOrigin, method);

      expect(
        (response.headers['access-control-allow-methods'] ?? '').split(','),
      ).toContain(method);
    }
  });

  it('never names another origin, nor answers with a wildcard', async () => {
    const simple = await request(running.server)
      .post('/auth/login')
      .set('Origin', FOREIGN_ORIGIN)
      .send({ email: 'nobody@example.com', password: 'whatever-it-is' });
    const asked = await preflight(FOREIGN_ORIGIN);

    for (const response of [simple, asked]) {
      const allowed = response.headers['access-control-allow-origin'] as
        string | undefined;

      expect(allowed).not.toBe(FOREIGN_ORIGIN);
      expect(allowed).not.toBe('*');
    }
  });
});
