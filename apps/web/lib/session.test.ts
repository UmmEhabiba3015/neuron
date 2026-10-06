import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSession, type Fetch } from './session.ts';

/*
 * A stand-in for the API. Each test says how a path answers; the stand-in
 * records every request that was sent, which is what the claims are about.
 *
 * It refuses to answer more than MAX_CALLS requests. A session that retries
 * without limit would otherwise hang the test run instead of failing it.
 */
const API = 'http://api.test';
const MAX_CALLS = 20;

type Sent = { path: string; method: string; token?: string; cookie: boolean };
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

const USER = { id: 'u1', email: 'a@b.test', createdAt: '2026-10-06T09:00:00Z' };

const signedInAs = (accessToken: string): Reply => ({
  status: 200,
  body: { accessToken, user: USER },
});

const UNAUTHORIZED: Reply = { status: 401, body: { message: 'Unauthorized' } };

/* A reply the test releases by hand, to hold a request in flight. */
function held() {
  let release!: (reply: Reply) => void;
  const reply = new Promise<Reply>((resolve) => {
    release = resolve;
  });

  return { reply, release };
}

/* Lets every promise that is already able to settle do so. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

/* Entries answer only to the token called "new". */
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

  /* Both have their 401 by now, and the refresh has not answered. */
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

  /* A screen that mounts later asks again, and the answer is already known. */
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

  assert.deepEqual(await session.restore(), { status: 'unreachable' });

  reachable = true;
  assert.equal((await session.restore()).status, 'signedIn');
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

  await session.register(USER.email, 'a password');
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

  assert.deepEqual(await session.register('x', 'y'), {
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
