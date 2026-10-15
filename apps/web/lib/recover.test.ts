import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SIGN_IN_AFTER_RESET,
  forgotOutcome,
  isAfterReset,
  readForgotForm,
  readResetForm,
  resetOutcome,
  tokenFrom,
} from './recover.ts';

const MIN = 8;

test('the token is read from the address exactly as it came', () => {
  assert.equal(tokenFrom('abc_-123'), 'abc_-123');
  assert.equal(tokenFrom(['first', 'second']), 'first');
});

test('an address with no token, or an empty one, has no token', () => {
  assert.equal(tokenFrom(undefined), null);
  assert.equal(tokenFrom(''), null);
  assert.equal(tokenFrom('   '), null);
  assert.equal(tokenFrom([]), null);
});

test('sign in knows it was reached from a reset, and only from one', () => {
  const mark = new URL(SIGN_IN_AFTER_RESET, 'http://web.test');

  assert.equal(mark.pathname, '/in');
  assert.equal(isAfterReset(mark.searchParams.get('reset') ?? undefined), true);
  assert.equal(isAfterReset(undefined), false);
  assert.equal(isAfterReset('yes'), false);
});

test('the address is sent without the spaces at its ends', () => {
  assert.deepEqual(readForgotForm('  umer@example.com '), {
    send: true,
    email: 'umer@example.com',
  });
});

test('nothing is sent for something that is not an address', () => {
  for (const typed of ['', '   ', 'umer', 'umer@', 'um er@example.com']) {
    assert.deepEqual(readForgotForm(typed), { send: false }, typed);
  }
});

test('every answer to asking for a link is the same to the person, a refusal included', () => {
  assert.equal(forgotOutcome({ kind: 'ok', data: undefined }), 'sent');
  assert.equal(
    forgotOutcome({ kind: 'rejected', status: 400, messages: ['x'] }),
    'sent',
  );
  assert.equal(
    forgotOutcome({ kind: 'rejected', status: 500, messages: [] }),
    'sent',
  );
  assert.equal(forgotOutcome({ kind: 'unreachable' }), 'unreachable');
});

test('a new password is judged as on create account', () => {
  assert.deepEqual(readResetForm('short', 'short', MIN), {
    send: false,
    problems: { password: 'tooShort' },
    first: 'password',
  });
  assert.deepEqual(readResetForm('long enough', '', MIN), {
    send: false,
    problems: { confirmation: 'notRepeated' },
    first: 'confirmation',
  });
  assert.deepEqual(readResetForm('long enough', 'Long enough', MIN), {
    send: false,
    problems: { confirmation: 'notMatching' },
    first: 'confirmation',
  });
  assert.deepEqual(readResetForm(' long enough ', ' long enough ', MIN), {
    send: true,
    password: ' long enough ',
  });
});

test('a reset that worked is a changed password', () => {
  assert.deepEqual(resetOutcome({ kind: 'ok', data: undefined }), {
    kind: 'changed',
  });
});

test('a 400 about the link is a bad link, whatever its words', () => {
  for (const messages of [
    ['This reset link has expired or has already been used'],
    ['token should not be empty'],
    [],
  ]) {
    assert.deepEqual(
      resetOutcome({ kind: 'rejected', status: 400, messages }),
      { kind: 'badLink' },
    );
  }
});

test('a 400 about the password is about the password, and keeps its words', () => {
  assert.deepEqual(
    resetOutcome({
      kind: 'rejected',
      status: 400,
      messages: ['password must be shorter than or equal to 128 characters'],
    }),
    {
      kind: 'password',
      message: 'password must be shorter than or equal to 128 characters',
    },
  );
});

test('no answer, and any other answer, are told apart', () => {
  assert.deepEqual(resetOutcome({ kind: 'unreachable' }), {
    kind: 'unreachable',
  });
  assert.deepEqual(
    resetOutcome({ kind: 'rejected', status: 500, messages: [] }),
    { kind: 'failed' },
  );
});
