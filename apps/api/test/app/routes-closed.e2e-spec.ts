import request from 'supertest';
import { startApp, stopApp, type RunningApp } from '../support/app';

/*
 * ADR-013: every route is closed unless it is marked @Public(). The guard is
 * registered for the whole application, so a route added without thinking
 * about it is closed too. What the guard decides for each kind of token is
 * a unit test of JwtAuthGuard; this is the guard in front of every route.
 */
describe('routes closed by default (e2e)', () => {
  let running: RunningApp;

  const CLOSED: [string, string][] = [
    ['GET', '/entries'],
    ['GET', '/entries/count'],
    ['GET', '/entries/some-id'],
    ['POST', '/entries'],
    ['PATCH', '/entries/some-id'],
    ['DELETE', '/entries/some-id'],
    ['GET', '/days?from=2026-08-01&to=2026-08-31'],
    ['GET', '/days/today'],
    ['GET', '/days/2026-08-09'],
    ['GET', '/days/2031-01-01'],
    ['PUT', '/days/2026-08-09/mood'],
    ['GET', '/auth/me'],
    ['GET', '/auth/sessions'],
    ['POST', '/auth/logout'],
    ['POST', '/auth/logout-everywhere'],
  ];

  const send = (method: string, url: string, authorization?: string) => {
    const agent = request(running.server);
    const call = {
      GET: () => agent.get(url),
      POST: () => agent.post(url).send({ content: 'x' }),
      PUT: () => agent.put(url).send({ mood: 'Even' }),
      PATCH: () => agent.patch(url).send({ content: 'x' }),
      DELETE: () => agent.delete(url),
    }[method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE']();

    return authorization === undefined
      ? call
      : call.set('Authorization', authorization);
  };

  beforeAll(async () => {
    running = await startApp();
  });

  afterAll(async () => {
    await stopApp(running);
  });

  it('answers 401 on every closed route without a valid token, and says why only in the header', async () => {
    for (const [method, url] of CLOSED) {
      for (const authorization of [undefined, 'Bearer not-a-token']) {
        const response = await send(method, url, authorization);

        expect([method, url, response.status]).toEqual([method, url, 401]);
        expect(response.body).toEqual({
          message: 'Unauthorized',
          statusCode: 401,
        });
        expect(response.headers['www-authenticate']).toContain(
          authorization === undefined ? 'invalid_request' : 'invalid_token',
        );
      }
    }
  });

  it('checks the token before the body, so a bad body without a token is a 401', async () => {
    await request(running.server)
      .post('/entries')
      .send({ not_a_real_field: true })
      .expect(401);
  });

  it('leaves registering, signing in, refreshing and resetting a password open', async () => {
    for (const url of [
      '/auth/register',
      '/auth/login',
      '/auth/forgot-password',
      '/auth/reset-password',
    ]) {
      const response = await request(running.server).post(url).send({});

      expect([url, response.status]).toEqual([url, 400]);
      expect(response.headers['www-authenticate']).toBeUndefined();
    }

    /*
     * Refresh with no cookie is refused too, but by its own handler, which
     * the guard let it reach: the guard's answer has a WWW-Authenticate
     * header and no message of its own.
     */
    const refresh = await request(running.server)
      .post('/auth/refresh')
      .expect(401);

    expect((refresh.body as { message: string }).message).toBe(
      'Invalid or expired session',
    );
    expect(refresh.headers['www-authenticate']).toBeUndefined();
  });
});
