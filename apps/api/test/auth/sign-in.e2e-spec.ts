import request from 'supertest';
import { REFRESH_TOKEN_LIFETIME_DAYS } from '../../src/auth/auth.service';
import { REFRESH_COOKIE_NAME } from '../../src/auth/refresh-cookie';
import { SessionEntity } from '../../src/auth/entities/session.entity';
import { as, startApp, stopApp, type RunningApp } from '../support/app';
import {
  refreshCookieFrom,
  refreshTokenIn,
  type RefreshCookie,
} from '../support/refresh-cookie';

interface Device {
  accessToken: string;
  authorization: string;
  cookie: RefreshCookie;
}

/*
 * Signing in, staying signed in, and signing out, the way the web app does
 * it: an access token in the Authorization header, and a refresh token in a
 * cookie that only POST /auth/refresh ever receives.
 *
 * The rules underneath -- what a token holds, when a session counts as
 * ended, how a cookie is read -- are unit tests beside AuthService,
 * JwtAuthGuard and refresh-cookie.ts. These are the flows through them.
 */
describe('signing in and out (e2e)', () => {
  let running: RunningApp;

  const credentials = {
    email: 'umer@example.com',
    password: 'a-long-enough-password',
  };

  const signIn = async (): Promise<Device> => {
    const response = await request(running.server)
      .post('/auth/login')
      .send(credentials)
      .expect(200);
    const { accessToken } = response.body as { accessToken: string };

    return {
      accessToken,
      authorization: `Bearer ${accessToken}`,
      cookie: refreshCookieFrom(response),
    };
  };

  const refreshWith = (cookie: RefreshCookie | string) =>
    request(running.server)
      .post('/auth/refresh')
      .set('Cookie', typeof cookie === 'string' ? cookie : cookie.pair);

  const me = (device: Pick<Device, 'authorization'>) =>
    request(running.server)
      .get('/auth/me')
      .set('Authorization', device.authorization);

  const sessionRows = () =>
    running.dataSource.getRepository(SessionEntity).find();

  beforeEach(async () => {
    running = await startApp();

    await request(running.server)
      .post('/auth/register')
      .send({ ...credentials, name: 'Umer', timezone: 'UTC' })
      .expect(201);
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('registers, signs in, refreshes, signs out, and cannot refresh again', async () => {
    const device = await signIn();

    expect((await me(device).expect(200)).body).toMatchObject({
      email: 'umer@example.com',
      name: 'Umer',
    });

    /* A refresh needs no access token: the cookie is the whole credential. */
    const refreshed = await refreshWith(device.cookie).expect(200);
    const next: Device = {
      accessToken: (refreshed.body as { accessToken: string }).accessToken,
      authorization: `Bearer ${(refreshed.body as { accessToken: string }).accessToken}`,
      cookie: refreshCookieFrom(refreshed),
    };

    await me(next).expect(200);
    expect(refreshTokenIn(next.cookie)).not.toBe(refreshTokenIn(device.cookie));
    expect(next.cookie.value.split('.')[0]).toBe(
      device.cookie.value.split('.')[0],
    );

    const [session] = await sessionRows();
    expect(session.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(session.refreshTokenHash).not.toContain(refreshTokenIn(next.cookie));

    await request(running.server)
      .post('/auth/logout')
      .set('Authorization', next.authorization)
      .expect(204);

    /* The access token stops working at once, not when it expires. */
    await me(next).expect(401);
    await refreshWith(next.cookie).expect(401);
  });

  it('ends every session of the person when an old refresh token is used again', async () => {
    const laptop = await signIn();
    const phone = await signIn();

    const rotated = refreshCookieFrom(
      await refreshWith(laptop.cookie).expect(200),
    );

    /*
     * Somebody holds the laptop's old token. Either they stole it or the
     * laptop is replaying it; the server cannot tell which, so every session
     * of this person ends.
     */
    await refreshWith(laptop.cookie).expect(401);

    const sessions = await sessionRows();
    expect(sessions).toHaveLength(2);
    expect(sessions.every((session) => session.revokedAt !== null)).toBe(true);

    await refreshWith(rotated).expect(401);
    await refreshWith(phone.cookie).expect(401);
    await me(phone).expect(401);
  });

  it('sets the refresh cookie HttpOnly, SameSite=Strict, on /auth/refresh only, for thirty days', async () => {
    const login = await request(running.server)
      .post('/auth/login')
      .send(credentials)
      .expect(200);
    const refresh = await refreshWith(refreshCookieFrom(login)).expect(200);
    const [session] = await sessionRows();

    for (const response of [login, refresh]) {
      const cookie = refreshCookieFrom(response);

      expect(cookie.attributes).toContain('HttpOnly');
      expect(cookie.attributes).toContain('SameSite=Strict');
      expect(cookie.attributes).toContain('Path=/auth/refresh');
      expect(cookie.attributes).toContain(
        `Max-Age=${REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60}`,
      );
      /* Not until HTTPS exists (ADR-018). */
      expect(cookie.attributes).not.toContain('Secure');
      expect(cookie.value.startsWith(`${session.id}.`)).toBe(true);

      /* The refresh token travels in the cookie and nowhere else. */
      expect(Object.keys(response.body as object).sort()).toEqual([
        'accessToken',
        'user',
      ]);
      expect(response.text).not.toContain(refreshTokenIn(cookie));
    }
  });

  it('reads the refresh token only from the cookie, and answers every bad cookie alike', async () => {
    const device = await signIn();
    const [session] = await sessionRows();

    const responses = [
      await request(running.server)
        .post('/auth/refresh')
        .send({
          sessionId: session.id,
          refreshToken: refreshTokenIn(device.cookie),
        }),
      await refreshWith('some_other_cookie=value'),
      await refreshWith(`${REFRESH_COOKIE_NAME}=no-separator-in-this-value`),
      await refreshWith(
        `${REFRESH_COOKIE_NAME}=00000000-0000-0000-0000-000000000000.${refreshTokenIn(device.cookie)}`,
      ),
      await refreshWith(`${REFRESH_COOKIE_NAME}=${session.id}.not-the-token`),
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

  it('signs out one device, then every device, and clears the cookie each time', async () => {
    const laptop = await signIn();
    const phone = await signIn();
    const tablet = await signIn();

    const signedOut = await request(running.server)
      .post('/auth/logout')
      .set('Authorization', laptop.authorization)
      .expect(204);

    await me(laptop).expect(401);
    await me(phone).expect(200);
    await me(tablet).expect(200);

    const everywhere = await request(running.server)
      .post('/auth/logout-everywhere')
      .set('Authorization', phone.authorization)
      .expect(204);

    await me(phone).expect(401);
    await me(tablet).expect(401);
    await refreshWith(tablet.cookie).expect(401);

    /* A browser clears a cookie only on the path it was set with. */
    for (const response of [signedOut, everywhere]) {
      const cleared = refreshCookieFrom(response);

      expect(cleared.value).toBe('');
      expect(cleared.attributes).toContain('Path=/auth/refresh');
      expect(cleared.attributes).toContain(
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      );
    }
  });

  it('lists the sessions still signed in', async () => {
    const laptop = await signIn();
    const phone = await signIn();

    const before = await as(running.server, phone.authorization)
      .get('/auth/sessions')
      .expect(200);

    expect(before.body).toHaveLength(2);

    await request(running.server)
      .post('/auth/logout')
      .set('Authorization', laptop.authorization)
      .expect(204);

    const after = await as(running.server, phone.authorization)
      .get('/auth/sessions')
      .expect(200);

    expect(after.body).toHaveLength(1);
    expect(Object.keys((after.body as object[])[0]).sort()).toEqual([
      'createdAt',
      'expiresAt',
      'id',
      'revokedAt',
      'userId',
    ]);
  });
});
