import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSession, type Fetch } from './session.ts';

/*
 * The stand-in refuses to answer more than MAX_CALLS requests. A session that
 * retries without limit would otherwise hang the test run instead of failing
 * it.
 */
const API = 'http://api.test';
const MAX_CALLS = 20;

type Sent = {
  path: string;
  method: string;
  token?: string;
  cookie: boolean;
  body?: unknown;
};
type Reply = { status: number; body?: unknown } | 'no answer';
type Handler = (sent: Sent) => Reply | Promise<Reply>;

function fakeApi(handlers: Record<string, Handler>) {
  const calls: Sent[] = [];

  const fetch: Fetch = async (url, init) => {
    const sent: Sent = {
      path: url.slice(API.length),
      method: init.method,
      token: init.headers['Authorization']?.replace('Bearer ', ''),
      cookie: init.credentials === 'include',
      ...(init.body !== undefined ? { body: JSON.parse(init.body) } : {}),
    };

    calls.push(sent);

    if (calls.length > MAX_CALLS) {
      throw new Error(`more than ${MAX_CALLS} requests were sent`);
    }

    const handler = handlers[sent.path];

    if (!handler) {
      throw new Error(`no handler for ${sent.path}`);
    }

    const reply = await handler(sent);

    if (reply === 'no answer') {
      throw new TypeError('Failed to fetch');
    }

    return { status: reply.status, json: async () => reply.body };
  };

  return {
    fetch,
    calls,
    sentTo: (path: string) => calls.filter((call) => call.path === path),
  };
}

const USER = {
  id: 'u1',
  email: 'a@b.test',
  name: 'Mubeen',
  createdAt: '2026-10-06T09:00:00Z',
};

const NEW_ACCOUNT = {
  email: USER.email,
  password: 'a password',
  name: USER.name,
  timezone: 'Asia/Karachi',
};

const signedInAs = (accessToken: string): Reply => ({
  status: 200,
  body: { accessToken, user: USER },
});

const UNAUTHORIZED: Reply = { status: 401, body: { message: 'Unauthorized' } };

function held() {
  let release!: (reply: Reply) => void;
  const reply = new Promise<Reply>((resolve) => {
    release = resolve;
  });

  return { reply, release };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

const onlyNewToken: Handler = (sent) =>
  sent.token === 'new' ? { status: 200, body: [] } : UNAUTHORIZED;

async function sessionHoldingToken(
  token: string,
  handlers: Record<string, Handler>,
) {
  const api = fakeApi({ '/auth/login': () => signedInAs(token), ...handlers });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  await session.login(USER.email, 'a password');

  return { api, session };
}

test('two requests that receive 401 together cause exactly one refresh, and both are repeated with the new token', async () => {
  const refresh = held();
  const { api, session } = await sessionHoldingToken('old', {
    '/auth/refresh': () => refresh.reply,
    '/entries': onlyNewToken,
    '/days/today': onlyNewToken,
  });

  const entries = session.request('/entries');
  const today = session.request('/days/today');

  await settle();
  refresh.release(signedInAs('new'));

  assert.equal((await entries).kind, 'ok');
  assert.equal((await today).kind, 'ok');

  assert.equal(api.sentTo('/auth/refresh').length, 1);
  assert.deepEqual(
    api.sentTo('/entries').map((call) => call.token),
    ['old', 'new'],
  );
  assert.deepEqual(
    api.sentTo('/days/today').map((call) => call.token),
    ['old', 'new'],
  );
});

test('a request is repeated at most once, even when the repeat is refused too', async () => {
  const { api, session } = await sessionHoldingToken('old', {
    '/auth/refresh': () => signedInAs('new'),
    '/entries': () => UNAUTHORIZED,
  });

  const result = await session.request('/entries');

  assert.equal(result.kind, 'ended');
  assert.equal(api.sentTo('/entries').length, 2);
  assert.equal(api.sentTo('/auth/refresh').length, 1);
  assert.deepEqual(session.getState(), { status: 'signedOut', ended: true });
});

test('a failed refresh reports that the session ended, and does not loop', async () => {
  const { api, session } = await sessionHoldingToken('old', {
    '/auth/refresh': () => UNAUTHORIZED,
    '/entries': () => UNAUTHORIZED,
  });

  const result = await session.request('/entries');

  assert.equal(result.kind, 'ended');
  assert.equal(api.sentTo('/auth/refresh').length, 1);
  assert.equal(api.sentTo('/entries').length, 1);
  assert.deepEqual(session.getState(), { status: 'signedOut', ended: true });
});

test('two calls to the on-load refresh made together cause exactly one request', async () => {
  const api = fakeApi({ '/auth/refresh': () => signedInAs('new') });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  const [first, second] = await Promise.all([
    session.restore(),
    session.restore(),
  ]);

  assert.equal(api.sentTo('/auth/refresh').length, 1);
  assert.equal(first.status, 'signedIn');
  assert.equal(second.status, 'signedIn');

  await session.restore();
  assert.equal(api.sentTo('/auth/refresh').length, 1);
});

test('the on-load refresh being refused means signed out, and not a session that ended', async () => {
  const api = fakeApi({ '/auth/refresh': () => UNAUTHORIZED });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  assert.deepEqual(await session.restore(), {
    status: 'signedOut',
    ended: false,
  });
});

test('no answer from the server is reported differently from a 401', async () => {
  const { api, session } = await sessionHoldingToken('old', {
    '/auth/refresh': () => signedInAs('new'),
    '/entries': () => 'no answer',
  });

  const result = await session.request('/entries');

  assert.equal(result.kind, 'unreachable');
  assert.equal(api.sentTo('/auth/refresh').length, 0);
  assert.equal(api.sentTo('/entries').length, 1);
  assert.equal(session.getState().status, 'signedIn');
});

test('no answer to the on-load refresh is neither signed in nor signed out, and can be asked again', async () => {
  let reachable = false;
  const api = fakeApi({
    '/auth/refresh': () => (reachable ? signedInAs('new') : 'no answer'),
  });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  assert.deepEqual(await session.restore(), {
    status: 'unreachable',
    asking: false,
    asked: 1,
  });

  reachable = true;
  assert.equal((await session.restore()).status, 'signedIn');
});

test('asking again after no answer says that it is asking, sends one request for two presses, and counts the question', async () => {
  const again = held();
  let first = true;
  const api = fakeApi({
    '/auth/refresh': () => {
      if (first) {
        first = false;
        return 'no answer';
      }

      return again.reply;
    },
  });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  await session.restore();

  const press = session.restore();
  const secondPress = session.restore();
  await settle();

  assert.deepEqual(session.getState(), {
    status: 'unreachable',
    asking: true,
    asked: 1,
  });
  assert.equal(api.sentTo('/auth/refresh').length, 2);

  again.release('no answer');
  await press;
  await secondPress;

  assert.deepEqual(session.getState(), {
    status: 'unreachable',
    asking: false,
    asked: 2,
  });
});

test('no answer to the refresh that follows a 401 does not end the session', async () => {
  const { session } = await sessionHoldingToken('old', {
    '/auth/refresh': () => 'no answer',
    '/entries': () => UNAUTHORIZED,
  });

  assert.equal((await session.request('/entries')).kind, 'unreachable');
  assert.equal(session.getState().status, 'signedIn');
});

test('a 401 that arrives after another request has already refreshed uses the new token without refreshing again', async () => {
  const slow = held();
  const { api, session } = await sessionHoldingToken('old', {
    '/auth/refresh': () => signedInAs('new'),
    '/entries': onlyNewToken,
    '/days/today': (sent) =>
      sent.token === 'new' ? { status: 200, body: {} } : slow.reply,
  });

  const today = session.request('/days/today');
  await session.request('/entries');

  slow.release(UNAUTHORIZED);

  assert.equal((await today).kind, 'ok');
  assert.equal(api.sentTo('/auth/refresh').length, 1);
});

test('only login and refresh ask the browser to store and attach the cookie', async () => {
  const { api, session } = await sessionHoldingToken('old', {
    '/auth/refresh': () => signedInAs('new'),
    '/auth/register': () => ({ status: 201, body: USER }),
    '/entries': onlyNewToken,
  });

  await session.register(NEW_ACCOUNT);
  await session.request('/entries');

  assert.deepEqual(
    api.calls.map((call) => [call.path, call.cookie]),
    [
      ['/auth/login', true],
      ['/auth/register', false],
      ['/entries', false],
      ['/auth/refresh', true],
      ['/entries', false],
    ],
  );
});

test('a refused login is a rejection with its status, and triggers no refresh', async () => {
  const api = fakeApi({
    '/auth/login': () => ({
      status: 401,
      body: { message: 'Invalid email or password' },
    }),
  });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  const result = await session.login(USER.email, 'wrong');

  assert.deepEqual(result, {
    kind: 'rejected',
    status: 401,
    messages: ['Invalid email or password'],
  });
  assert.equal(api.calls.length, 1);
  assert.equal(session.getState().status, 'unknown');
});

test('a validation failure carries every message the API sent', async () => {
  const messages = [
    'email must be an email address',
    'password must be longer than or equal to 8 characters',
  ];
  const api = fakeApi({
    '/auth/register': () => ({ status: 400, body: { message: messages } }),
  });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  assert.deepEqual(await session.register(NEW_ACCOUNT), {
    kind: 'rejected',
    status: 400,
    messages,
  });
});

test('subscribers are told when the state changes, and not after they leave', async () => {
  const api = fakeApi({
    '/auth/refresh': () => signedInAs('new'),
    '/auth/login': () => signedInAs('newer'),
  });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  let told = 0;
  const leave = session.subscribe(() => {
    told += 1;
  });

  await session.restore();
  assert.equal(told, 1);

  leave();
  await session.login(USER.email, 'a password');
  assert.equal(told, 1);
});

/* ---- What is sent, and who is signed in ------------------------------- */

function registering() {
  const api = fakeApi({
    '/auth/register': () => ({ status: 201, body: USER }),
  });

  return { api, session: createSession({ apiUrl: API, fetch: api.fetch }) };
}

test('a registration carries the email, the password, the name and the timezone, each as it was handed in', async () => {
  const { api, session } = registering();

  await session.register({
    email: 'mubeen@example.com',
    password: 'correct horse',
    name: 'Mubeen',
    timezone: 'Asia/Karachi',
  });

  assert.deepEqual(api.sentTo('/auth/register')[0].body, {
    email: 'mubeen@example.com',
    password: 'correct horse',
    name: 'Mubeen',
    timezone: 'Asia/Karachi',
  });
});

test('the timezone that is sent is the one that was handed in, whichever it is', async () => {
  for (const timezone of ['America/Los_Angeles', 'Europe/London', 'UTC']) {
    const { api, session } = registering();

    await session.register({ ...NEW_ACCOUNT, timezone });

    assert.equal(
      (api.sentTo('/auth/register')[0].body as { timezone: string }).timezone,
      timezone,
    );
  }
});

test('a browser that reports no timezone sends none, and nothing is put in its place', async () => {
  const { api, session } = registering();
  const browserSays = undefined as unknown as string;

  await session.register({ ...NEW_ACCOUNT, timezone: browserSays });

  assert.equal(
    'timezone' in (api.sentTo('/auth/register')[0].body as object),
    false,
  );
});

test('a registration sends nothing but the four fields of the contract', async () => {
  const { api, session } = registering();

  await session.register({
    ...NEW_ACCOUNT,
    confirmation: 'a password',
  } as never);

  assert.deepEqual(
    Object.keys(api.sentTo('/auth/register')[0].body as object).sort(),
    ['email', 'name', 'password', 'timezone'],
  );
});

test('a login carries the email and the password, and nothing else', async () => {
  const api = fakeApi({ '/auth/login': () => signedInAs('token') });
  const session = createSession({ apiUrl: API, fetch: api.fetch });

  await session.login('mubeen@example.com', 'correct horse');

  assert.deepEqual(api.sentTo('/auth/login')[0].body, {
    email: 'mubeen@example.com',
    password: 'correct horse',
  });
});

test('the name the API sends is carried with the signed-in user, after a login and after a refresh', async () => {
  const api = fakeApi({
    '/auth/login': () => signedInAs('token'),
    '/auth/refresh': () => signedInAs('token'),
  });

  const afterLogin = createSession({ apiUrl: API, fetch: api.fetch });
  const result = await afterLogin.login(USER.email, 'a password');

  assert.deepEqual(result, { kind: 'ok', data: USER });
  assert.deepEqual(afterLogin.getState(), { status: 'signedIn', user: USER });

  const afterRefresh = createSession({ apiUrl: API, fetch: api.fetch });

  assert.deepEqual(await afterRefresh.restore(), {
    status: 'signedIn',
    user: USER,
  });
});
