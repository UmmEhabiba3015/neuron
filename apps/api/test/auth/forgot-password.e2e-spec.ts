import { Logger } from '@nestjs/common';
import request from 'supertest';
import { INVALID_RESET_LINK } from '../../src/auth/auth.controller';
import {
  messagesFrom,
  startApp,
  stopApp,
  type RunningApp,
} from '../support/app';
import { refreshCookieFrom } from '../support/refresh-cookie';

/*
 * A forgotten password, the way she does it on her laptop: ask for a link,
 * copy it out of the API's log (ADR-022), open it, choose a new password.
 *
 * The rules underneath -- the hash stored, the expiry, single use, other
 * resets ended, sessions revoked -- are unit tests beside
 * PasswordResetService. This is the flow through the running app.
 */
describe('forgetting a password (e2e)', () => {
  let running: RunningApp;
  let logged: string[];

  const EMAIL = 'umer@example.com';
  const OLD_PASSWORD = 'the-old-password';
  const NEW_PASSWORD = 'a-brand-new-password';

  const login = (password: string) =>
    request(running.server)
      .post('/auth/login')
      .send({ email: EMAIL, password });

  /*
   * The answer to forgot-password does not wait for the email, so the email
   * is waited for here, a turn of the event loop at a time.
   */
  const emailedLink = async (): Promise<string> => {
    for (let turn = 0; turn < 1000; turn += 1) {
      const email = logged.find((line) => line.includes('/reset?token='));

      if (email) {
        return /(\S+\/reset\?token=[A-Za-z0-9_-]+)/.exec(email)![1];
      }

      await new Promise((resolve) => setImmediate(resolve));
    }

    throw new Error('no reset link was written to the log');
  };

  beforeEach(async () => {
    running = await startApp();

    logged = [];
    jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation((message: unknown) => {
        logged.push(String(message));
      });

    await request(running.server)
      .post('/auth/register')
      .send({
        email: EMAIL,
        password: OLD_PASSWORD,
        name: 'Umer',
        timezone: 'UTC',
      })
      .expect(201);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await stopApp(running);
  });

  it('asks, reads the link from the log, resets, signs every device out, and refuses the link a second time', async () => {
    const device = refreshCookieFrom(await login(OLD_PASSWORD).expect(200));

    await request(running.server)
      .post('/auth/forgot-password')
      .send({ email: EMAIL })
      .expect(204);

    const link = new URL(await emailedLink());
    expect(link.origin).toBe(process.env.WEB_ORIGIN);
    expect(link.pathname).toBe('/reset');
    const token = link.searchParams.get('token')!;

    const reset = await request(running.server)
      .post('/auth/reset-password')
      .send({ token, password: NEW_PASSWORD })
      .expect(204);

    /* Nothing signs the person in. */
    expect(reset.headers['set-cookie']).toBeUndefined();

    await request(running.server)
      .post('/auth/refresh')
      .set('Cookie', device.pair)
      .expect(401);
    await login(OLD_PASSWORD).expect(401);
    await login(NEW_PASSWORD).expect(200);

    const again = await request(running.server)
      .post('/auth/reset-password')
      .send({ token, password: 'yet-another-password' })
      .expect(400);

    expect((again.body as { message: string }).message).toBe(
      INVALID_RESET_LINK,
    );
    await login(NEW_PASSWORD).expect(200);
  });

  it('gives an address with no account the same answer, and sends nothing', async () => {
    const response = await request(running.server)
      .post('/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(204);

    expect(response.body).toEqual({});

    await request(running.server)
      .post('/auth/forgot-password')
      .send({ email: EMAIL })
      .expect(204);
    await emailedLink();

    expect(logged.filter((line) => line.includes('/reset?token='))).toEqual([
      expect.stringContaining(EMAIL),
    ]);
  });

  it('refuses a body that is not an address on forgot-password', async () => {
    const response = await request(running.server)
      .post('/auth/forgot-password')
      .send({ email: 'umer' })
      .expect(400);

    expect(messagesFrom(response)).toEqual(['email must be an email address']);
  });

  it('refuses a password that is too short on reset-password, before looking at the token', async () => {
    const response = await request(running.server)
      .post('/auth/reset-password')
      .send({ token: 'any-token', password: 'short' })
      .expect(400);

    expect(messagesFrom(response)).toEqual([
      expect.stringMatching(/^password must be longer than or equal to/),
    ]);
  });
});
