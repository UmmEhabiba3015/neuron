import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Session } from '@neuron/contracts';
import type { ApiResult, RequestOptions } from './api/session.ts';
import { DEVICE_NOT_SIGNED_OUT, createDevices, deviceLine } from './devices.ts';

const THIS: Session = {
  id: 'this',
  device: 'Chrome on Windows',
  createdAt: '2026-09-30T08:00:00.000Z',
  lastUsedAt: '2026-10-15T08:00:00.000Z',
  current: true,
};

const PHONE: Session = {
  id: 'phone',
  device: 'Safari on iPhone',
  createdAt: '2026-10-02T08:00:00.000Z',
  lastUsedAt: '2026-10-05T08:00:00.000Z',
  current: false,
};

type Answer = ApiResult<unknown> | Promise<ApiResult<unknown>>;

function fakeRequest(answers: Record<string, () => Answer>) {
  const sent: { path: string; method: string }[] = [];

  const request = async <T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> => {
    const method = options.method ?? 'GET';
    sent.push({ path, method });

    return (await answers[`${method} ${path}`]()) as ApiResult<T>;
  };

  return { request, sent };
}

/* How many rows the list shows, or -1 when it shows none. */
const rowsOf = (devices: ReturnType<typeof createDevices>) => {
  const view = devices.getState().view;

  return view.status === 'open' ? view.devices.length : -1;
};

const listed = () => ({ kind: 'ok' as const, data: [THIS, PHONE] });

test('a device line is in her words, with the dates in the person’s timezone', () => {
  assert.equal(
    deviceLine(THIS, 'UTC'),
    'This device. Last used now. Signed in 30 September 2026.',
  );
  assert.equal(
    deviceLine(PHONE, 'UTC'),
    'Last used 5 October 2026. Signed in 2 October 2026.',
  );

  /* 20:00Z on 15 October is the 16th in Karachi. */
  assert.equal(
    deviceLine(
      { ...PHONE, lastUsedAt: '2026-10-15T20:00:00.000Z' },
      'Asia/Karachi',
    ),
    'Last used 16 October 2026. Signed in 2 October 2026.',
  );
});

test('opening lists the devices the API sends, in its order', async () => {
  const api = fakeRequest({ 'GET /auth/sessions': listed });
  const devices = createDevices({ request: api.request });

  assert.deepEqual(devices.getState().view, { status: 'opening' });

  await devices.open();

  assert.deepEqual(devices.getState().view, {
    status: 'open',
    devices: [THIS, PHONE],
  });
});

test('a list that cannot be had says why, counts the tries, and can be asked for again', async () => {
  let answer: ApiResult<unknown> = { kind: 'unreachable' };
  const api = fakeRequest({ 'GET /auth/sessions': () => answer });
  const devices = createDevices({ request: api.request });

  await devices.open();
  assert.deepEqual(devices.getState().view, { status: 'unreachable', asked: 1 });

  answer = { kind: 'rejected', status: 500, messages: [] };
  await devices.open();
  assert.deepEqual(devices.getState().view, { status: 'failed', asked: 2 });

  answer = listed();
  await devices.open();
  assert.equal(devices.getState().view.status, 'open');
});

test('signing out a device sends DELETE for it alone, and its row leaves when the API confirms, not before', async () => {
  let confirm!: (answer: ApiResult<unknown>) => void;
  const api = fakeRequest({
    'GET /auth/sessions': listed,
    'DELETE /auth/sessions/phone': () =>
      new Promise((resolve) => {
        confirm = resolve;
      }),
  });
  const devices = createDevices({ request: api.request });
  await devices.open();

  const pressed = devices.signOut('phone');

  assert.deepEqual(devices.getState().signingOut, ['phone']);
  assert.equal(rowsOf(devices), 2);

  /* A second press while the first is out sends nothing. */
  await devices.signOut('phone');

  confirm({ kind: 'ok', data: undefined });
  await pressed;

  assert.deepEqual(
    api.sent.filter((each) => each.method === 'DELETE'),
    [{ path: '/auth/sessions/phone', method: 'DELETE' }],
  );
  assert.deepEqual(devices.getState().view, {
    status: 'open',
    devices: [THIS],
  });
  assert.deepEqual(devices.getState().signingOut, []);
});

test('a device the API no longer has (404) leaves the list as well', async () => {
  const api = fakeRequest({
    'GET /auth/sessions': listed,
    'DELETE /auth/sessions/phone': () => ({
      kind: 'rejected',
      status: 404,
      messages: ['Session with ID phone not found'],
    }),
  });
  const devices = createDevices({ request: api.request });
  await devices.open();

  await devices.signOut('phone');

  assert.deepEqual(devices.getState().view, {
    status: 'open',
    devices: [THIS],
  });
  assert.equal(devices.getState().notSignedOut, undefined);
});

test('a sign-out with no answer, or a failure, keeps the row and says so in it, until it is pressed again', async () => {
  let answer: ApiResult<unknown> = { kind: 'unreachable' };
  const api = fakeRequest({
    'GET /auth/sessions': listed,
    'DELETE /auth/sessions/phone': () => answer,
  });
  const devices = createDevices({ request: api.request });
  await devices.open();

  await devices.signOut('phone');
  assert.deepEqual(devices.getState().notSignedOut, {
    id: 'phone',
    why: 'unreachable',
  });
  assert.equal(rowsOf(devices), 2);

  answer = { kind: 'rejected', status: 500, messages: [] };
  await devices.signOut('phone');
  assert.deepEqual(devices.getState().notSignedOut, {
    id: 'phone',
    why: 'failed',
  });

  assert.match(DEVICE_NOT_SIGNED_OUT.unreachable, /still signed in/);
  assert.match(DEVICE_NOT_SIGNED_OUT.failed, /still signed in/);
});
