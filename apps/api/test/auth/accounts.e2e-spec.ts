import request from 'supertest';
import {
  messagesFrom,
  startApp,
  stopApp,
  type RunningApp,
} from '../support/app';

/*
 * Creating an account and signing in to it. Each input rule of registration
 * is a unit test in register.dto.spec.ts; here is one bad input per route,
 * to show validation is connected, and the rules that need the database and
 * the pipe together.
 */
describe('accounts (e2e)', () => {
  let running: RunningApp;

  const password = 'a-long-enough-password';

  const register = (body: Record<string, unknown>) =>
    request(running.server)
      .post('/auth/register')
      .send({ password, name: 'Habiba', timezone: 'UTC', ...body });

  const login = (body: Record<string, unknown>) =>
    request(running.server).post('/auth/login').send(body);

  const storedUsers = () =>
    running.dataSource.query<
      { email: string; name: string; timezone: string }[]
    >(`SELECT email, name, timezone FROM users`);

  beforeEach(async () => {
    running = await startApp();
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('makes one account of one address, whatever its capitals', async () => {
    const created = await register({
      email: 'Ummi@Example.com',
      name: '  Habiba  ',
      timezone: 'asia/karachi',
    }).expect(201);

    expect(Object.keys(created.body as object).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'name',
      'timezone',
    ]);

    /*
     * The pipe transforms before it validates, so what is stored is the
     * trimmed name and the timezone under its own name. The address is kept
     * as it was typed.
     */
    expect(await storedUsers()).toEqual([
      { email: 'Ummi@Example.com', name: 'Habiba', timezone: 'Asia/Karachi' },
    ]);

    const conflict = await register({ email: 'ummi@example.com' }).expect(409);

    expect((conflict.body as { message: string }).message).toBe(
      'That email address is already registered',
    );
    expect(conflict.text.toLowerCase()).not.toContain('ummi@example.com');
    expect(await storedUsers()).toHaveLength(1);

    const signedIn = await login({
      email: 'UMMI@EXAMPLE.COM',
      password,
    }).expect(200);

    expect((signedIn.body as { user: { email: string } }).user.email).toBe(
      'Ummi@Example.com',
    );
  });

  it('answers a wrong password and an unknown address with the same 401', async () => {
    await register({ email: 'known@example.com' }).expect(201);

    const wrongPassword = await login({
      email: 'known@example.com',
      password: 'not-the-password',
    }).expect(401);
    const unknownAddress = await login({
      email: 'nobody@example.com',
      password,
    }).expect(401);

    expect(unknownAddress.body).toEqual(wrongPassword.body);
    expect(wrongPassword.text).not.toContain('known');
  });

  it('refuses a bad body on each route, and creates nothing', async () => {
    const short = await register({
      email: 'umer@example.com',
      password: 'short',
    }).expect(400);

    expect(messagesFrom(short)).toEqual([
      'password must be longer than or equal to 8 characters',
    ]);
    expect(await storedUsers()).toEqual([]);

    await register({ email: 'umer@example.com' }).expect(201);

    await login({
      email: 'umer@example.com',
      password,
      isAdmin: true,
    }).expect(400);
  });
});
