import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  checkNewPassword,
  looksLikeEmail,
  placeMessages,
  readForm,
  type Typed,
} from './account-form.ts';
import { createSession, type Fetch } from './session.ts';

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

test('an email address needs something on each side of one @, and no spaces', () => {
  assert.equal(looksLikeEmail('mubeen@example.com'), true);
  assert.equal(looksLikeEmail(''), false);
  assert.equal(looksLikeEmail('not-an-email'), false);
  assert.equal(looksLikeEmail('@example.com'), false);
  assert.equal(looksLikeEmail('mubeen@'), false);
  assert.equal(looksLikeEmail('mu been@example.com'), false);
});

/* ---- What stops a send: the whole form -------------------------------- */

const LIMITS = { passwordMinLength: 8, nameMaxLength: 60 };

/* A create-account form with nothing wrong in it. Each test spoils one part. */
const GOOD: Typed = {
  name: 'Mubeen',
  email: 'mubeen@example.com',
  password: 'correct horse',
  confirmation: 'correct horse',
};

function problemsOf(mode: 'in' | 'new', typed: Partial<Typed>) {
  const reading = readForm(mode, { ...GOOD, ...typed }, LIMITS);

  return reading.send ? {} : reading.problems;
}

test('create account with nothing wrong is sent, with the name, the email and the password', () => {
  assert.deepEqual(readForm('new', GOOD, LIMITS), {
    send: true,
    details: {
      name: 'Mubeen',
      email: 'mubeen@example.com',
      password: 'correct horse',
    },
  });
});

test('create account: each field`s problem alone, and no other field is blamed for it', () => {
  assert.deepEqual(problemsOf('new', { name: '' }), { name: 'noName' });
  assert.deepEqual(problemsOf('new', { email: 'not-an-email' }), {
    email: 'notAnEmail',
  });
  assert.deepEqual(
    problemsOf('new', { password: 'short', confirmation: 'short' }),
    {
      password: 'tooShort',
    },
  );
  assert.deepEqual(problemsOf('new', { confirmation: '' }), {
    confirmation: 'notRepeated',
  });
});

test('create account: two passwords that differ stop the send, and the second field is the one at fault', () => {
  const reading = readForm(
    'new',
    { ...GOOD, password: 'correct horse', confirmation: 'correct house' },
    LIMITS,
  );

  assert.deepEqual(reading, {
    send: false,
    problems: { confirmation: 'notMatching' },
    first: 'confirmation',
  });
});

test('create account: every field wrong at once gives each its own problem, and the first is the name', () => {
  const reading = readForm(
    'new',
    { name: '  ', email: '', password: 'correct horse', confirmation: 'other' },
    LIMITS,
  );

  assert.deepEqual(reading, {
    send: false,
    problems: {
      name: 'noName',
      email: 'notAnEmail',
      confirmation: 'notMatching',
    },
    first: 'name',
  });
});

test('create account: a password that is too short is the only password problem, even when the two also differ', () => {
  assert.deepEqual(
    problemsOf('new', { email: '', password: 'short', confirmation: 'other' }),
    { email: 'notAnEmail', password: 'tooShort' },
  );
});

test('the first field with a problem is the first on the screen: name, email, password, then the second password', () => {
  const first = (typed: Partial<Typed>) => {
    const reading = readForm('new', { ...GOOD, ...typed }, LIMITS);

    return reading.send ? null : reading.first;
  };

  assert.equal(first({ name: '', email: '', password: '' }), 'name');
  assert.equal(first({ email: '', password: '' }), 'email');
  assert.equal(first({ password: '' }), 'password');
  assert.equal(first({ confirmation: '' }), 'confirmation');
  assert.equal(first({}), null);
});

test('sign in with nothing wrong is sent, and sends no name', () => {
  assert.deepEqual(
    readForm(
      'in',
      {
        name: '',
        email: 'mubeen@example.com',
        password: 'x',
        confirmation: '',
      },
      LIMITS,
    ),
    {
      send: true,
      details: { name: '', email: 'mubeen@example.com', password: 'x' },
    },
  );
});

test('sign in: each field`s problem alone, and both together', () => {
  const typed = { name: '', confirmation: '' };

  assert.deepEqual(problemsOf('in', { ...typed, email: '' }), {
    email: 'notAnEmail',
  });
  assert.deepEqual(problemsOf('in', { ...typed, password: '' }), {
    password: 'noPassword',
  });
  assert.deepEqual(problemsOf('in', { ...typed, email: '', password: '' }), {
    email: 'notAnEmail',
    password: 'noPassword',
  });
});

test('sign in asks for no name, no second password, and no length: only that a password was typed', () => {
  assert.deepEqual(
    problemsOf('in', { name: '', password: 'x', confirmation: 'different' }),
    {},
  );
});

test('the email is judged and sent without the spaces at its two ends', () => {
  const reading = readForm(
    'in',
    { ...GOOD, email: '  mubeen@example.com ' },
    LIMITS,
  );

  assert.equal(reading.send && reading.details.email, 'mubeen@example.com');
});

/* ---- The name --------------------------------------------------------- */

test('an empty name, and a name of spaces only, are both no name', () => {
  assert.deepEqual(problemsOf('new', { name: '' }), { name: 'noName' });
  assert.deepEqual(problemsOf('new', { name: '   ' }), { name: 'noName' });
  assert.deepEqual(problemsOf('new', { name: ' \t\n ' }), { name: 'noName' });
});

test('a name of exactly the maximum is accepted, and one character more is too long', () => {
  assert.deepEqual(problemsOf('new', { name: 'a'.repeat(60) }), {});
  assert.deepEqual(problemsOf('new', { name: 'a'.repeat(61) }), {
    name: 'nameTooLong',
  });
});

test('the maximum is the one that was handed in', () => {
  const limits = { ...LIMITS, nameMaxLength: 3 };

  assert.equal(readForm('new', { ...GOOD, name: 'abc' }, limits).send, true);
  assert.equal(readForm('new', { ...GOOD, name: 'abcd' }, limits).send, false);
});

test('spaces around a valid name are not part of it: it is sent without them, and the spaces inside stay', () => {
  const reading = readForm(
    'new',
    { ...GOOD, name: '  Umm e Habiba  ' },
    LIMITS,
  );

  assert.equal(reading.send && reading.details.name, 'Umm e Habiba');
});

test('the maximum is counted after the spaces around the name are gone', () => {
  const name = ` ${'a'.repeat(60)} `;
  const reading = readForm('new', { ...GOOD, name }, LIMITS);

  assert.equal(reading.send && reading.details.name.length, 60);
});

test('a character the API counts as one is counted as one here, so the browser never refuses a name the API accepts', () => {
  /* An emoji is two units of `.length`, and one character to the API. */
  assert.equal('😀'.length, 2);
  assert.deepEqual(problemsOf('new', { name: '😀'.repeat(60) }), {});
  assert.deepEqual(problemsOf('new', { name: '😀'.repeat(61) }), {
    name: 'nameTooLong',
  });

  /* A heart drawn in colour is a heart and one invisible mark. */
  assert.deepEqual(problemsOf('new', { name: '\u2764\uFE0F'.repeat(60) }), {});
});

test('a name typed with spaces around it reaches the API without them, beside the timezone that was handed in', async () => {
  let body: unknown;
  const fetch: Fetch = async (_url, init) => {
    body = JSON.parse(init.body!);
    return { status: 201, json: async () => ({}) };
  };
  const session = createSession({ apiUrl: 'http://api.test', fetch });
  const reading = readForm('new', { ...GOOD, name: '  Mubeen ' }, LIMITS);

  assert.equal(reading.send, true);

  if (reading.send) {
    await session.register({ ...reading.details, timezone: 'Asia/Karachi' });
  }

  assert.deepEqual(body, {
    email: 'mubeen@example.com',
    password: 'correct horse',
    name: 'Mubeen',
    timezone: 'Asia/Karachi',
  });
});

/* ---- A 400 from the API ----------------------------------------------- */

test('a 400 about the name lands on the name field, as the API wrote it', () => {
  assert.deepEqual(
    placeMessages(['name must be shorter than or equal to 60 characters']),
    {
      fields: { name: 'name must be shorter than or equal to 60 characters' },
      timezone: false,
      other: [],
    },
  );
});

test('a 400 about the timezone lands on no field: it is the whole form`s', () => {
  assert.deepEqual(
    placeMessages([
      'timezone must be an IANA time zone name such as Asia/Karachi',
    ]),
    { fields: {}, timezone: true, other: [] },
  );
});

test('messages about several fields each find their own, the first about a field is the one kept, and the rest are not lost', () => {
  assert.deepEqual(
    placeMessages([
      'name must contain at least one character that is not whitespace',
      'name must be a string',
      'email must be an email address',
      'password must be longer than or equal to 8 characters',
      'timezone must be an IANA time zone name such as Asia/Karachi',
      'property nickname should not exist',
    ]),
    {
      fields: {
        name: 'name must contain at least one character that is not whitespace',
        email: 'email must be an email address',
        password: 'password must be longer than or equal to 8 characters',
      },
      timezone: true,
      other: ['property nickname should not exist'],
    },
  );
});

test('a message is placed by its first word and not by a word inside it', () => {
  assert.deepEqual(placeMessages(['nameless must not be sent']).fields, {});
  assert.deepEqual(placeMessages(['property name should not exist']).other, [
    'property name should not exist',
  ]);
});
