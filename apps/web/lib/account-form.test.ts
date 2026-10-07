import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkNewPassword, fieldOf, looksLikeEmail } from './account-form.ts';

const MIN = 8;

test('two passwords that are long enough and the same have no problem', () => {
  assert.equal(checkNewPassword('correct horse', 'correct horse', MIN), null);
});

test('the minimum itself is long enough, and one character fewer is not', () => {
  assert.equal(checkNewPassword('12345678', '12345678', MIN), null);
  assert.equal(checkNewPassword('1234567', '1234567', MIN), 'tooShort');
});

test('an empty password is too short', () => {
  assert.equal(checkNewPassword('', '', MIN), 'tooShort');
});

test('a second field left empty is its own problem, and not a mismatch', () => {
  assert.equal(checkNewPassword('correct horse', '', MIN), 'notRepeated');
});

test('two passwords that differ do not match', () => {
  assert.equal(
    checkNewPassword('correct horse', 'correct house', MIN),
    'notMatching',
  );
});

test('the two are compared exactly as typed', () => {
  assert.equal(
    checkNewPassword('correct horse', 'Correct horse', MIN),
    'notMatching',
  );
  assert.equal(
    checkNewPassword('correct horse', 'correct horse ', MIN),
    'notMatching',
  );
});

test('when the password is too short and the two also differ, too short wins', () => {
  assert.equal(checkNewPassword('short', 'different', MIN), 'tooShort');
  assert.equal(checkNewPassword('short', '', MIN), 'tooShort');
});

test('a short password repeated correctly is still too short', () => {
  assert.equal(checkNewPassword('short', 'short', MIN), 'tooShort');
});

test('the length rule belongs to the first field, and the other two to the second', () => {
  assert.equal(fieldOf('tooShort'), 'password');
  assert.equal(fieldOf('notRepeated'), 'confirmation');
  assert.equal(fieldOf('notMatching'), 'confirmation');
});

test('an email address needs something on each side of one @, and no spaces', () => {
  assert.equal(looksLikeEmail('mubeen@example.com'), true);
  assert.equal(looksLikeEmail(''), false);
  assert.equal(looksLikeEmail('not-an-email'), false);
  assert.equal(looksLikeEmail('@example.com'), false);
  assert.equal(looksLikeEmail('mubeen@'), false);
  assert.equal(looksLikeEmail('mu been@example.com'), false);
});
