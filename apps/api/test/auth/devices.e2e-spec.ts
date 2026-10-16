import request from 'supertest';
import { REFRESH_COOKIE_NAME } from '../../src/auth/refresh-cookie';
import { as, startApp, stopApp, type RunningApp } from '../support/app';
import {
  refreshCookieFrom,
  type RefreshCookie,
} from '../support/refresh-cookie';

interface Device {
  authorization: string;
  cookie: RefreshCookie;
}

/*
 * The devices on Account (docs/features.md, Ref 6): every place a person is
 * signed in, listed, and signed out one at a time. How a device is named,
 * the order of the list, and which session counts as ended are unit tests
 * beside deviceName, AuthService and SessionsRepository. These are the
 * flows, and the ownership rule only the running app can show.
 */
describe('signed-in devices (e2e)', () => {
  let running: RunningApp;

  const LAPTOP =
    'Mozilla/5.0 (X11; Linux x86_64; rv:157.0) Gecko/20100101 Firefox/157.0';
  const PHONE =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
  const PASSWORD = 'a-long-enough-password';

  const signIn = async (email: string, userAgent: string): Promise<Device> => {
    const response = await request(running.server)
      .post('/auth/login')
      .set('User-Agent', userAgent)
      .send({ email, password: PASSWORD })
      .expect(200);

    return {
      authorization: `Bearer ${(response.body as { accessToken: string }).accessToken}`,
      cookie: refreshCookieFrom(response),
    };
  };

  const devicesOf = async (device: Device) =>
    (
      await as(running.server, device.authorization)
        .get('/auth/sessions')
        .expect(200)
    ).body as { id: string; device: string; current: boolean }[];

  const refreshWith = (device: Device) =>
    request(running.server)
      .post('/auth/refresh')
      .set('Cookie', device.cookie.pair);

  beforeEach(async () => {
    running = await startApp();

    for (const email of ['habiba@example.com', 'umer@example.com']) {
      await request(running.server)
        .post('/auth/register')
        .send({ email, password: PASSWORD, name: 'Somebody', timezone: 'UTC' })
        .expect(201);
    }
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('lists two sign-ins by device, and marks the one asking as current', async () => {
    const laptop = await signIn('habiba@example.com', LAPTOP);
    const phone = await signIn('habiba@example.com', PHONE);
    await signIn('umer@example.com', LAPTOP);

    const fromThePhone = await devicesOf(phone);

    expect(
      fromThePhone
        .map(({ device, current }) => ({ device, current }))
        .sort((a, b) => a.device.localeCompare(b.device)),
    ).toEqual([
      { device: 'Firefox on Linux', current: false },
      { device: 'Safari on iPhone', current: true },
    ]);

    const fromTheLaptop = await devicesOf(laptop);
    expect(fromTheLaptop.find((each) => each.current)?.device).toBe(
      'Firefox on Linux',
    );
  });

  it('signs out another device: its access token and its refresh are refused, and this one carries on', async () => {
    const laptop = await signIn('habiba@example.com', LAPTOP);
    const phone = await signIn('habiba@example.com', PHONE);
    const phoneId = (await devicesOf(laptop)).find((each) => !each.current)!.id;

    const answer = await as(running.server, laptop.authorization)
      .delete(`/auth/sessions/${phoneId}`)
      .expect(204);

    /* Another device's cookie is not this browser's to clear. */
    expect(answer.headers['set-cookie']).toBeUndefined();

    await as(running.server, phone.authorization).get('/auth/me').expect(401);
    await refreshWith(phone).expect(401);

    expect((await devicesOf(laptop)).map((each) => each.device)).toEqual([
      'Firefox on Linux',
    ]);
    await refreshWith(laptop).expect(200);

    /* Already ended: the same 404 as a session that never was. */
    await as(running.server, laptop.authorization)
      .delete(`/auth/sessions/${phoneId}`)
      .expect(404);
  });

  it("answers another person's session with a 404, and leaves it signed in", async () => {
    const mine = await signIn('habiba@example.com', LAPTOP);
    const theirs = await signIn('umer@example.com', PHONE);
    const theirId = (await devicesOf(theirs))[0].id;

    const answer = await as(running.server, mine.authorization)
      .delete(`/auth/sessions/${theirId}`)
      .expect(404);

    expect(answer.body).toEqual({
      message: `Session with ID ${theirId} not found`,
      error: 'Not Found',
      statusCode: 404,
    });
    await as(running.server, theirs.authorization).get('/auth/me').expect(200);
    await refreshWith(theirs).expect(200);
  });

  it('signs out this device when it names itself, and clears its cookie', async () => {
    const laptop = await signIn('habiba@example.com', LAPTOP);
    const ownId = (await devicesOf(laptop))[0].id;

    const answer = await as(running.server, laptop.authorization)
      .delete(`/auth/sessions/${ownId}`)
      .expect(204);

    const cleared = refreshCookieFrom(answer);
    expect(cleared.pair).toBe(`${REFRESH_COOKIE_NAME}=`);
    expect(cleared.attributes).toContain('Path=/auth/refresh');

    await as(running.server, laptop.authorization).get('/auth/me').expect(401);
    await refreshWith(laptop).expect(401);
  });
});
