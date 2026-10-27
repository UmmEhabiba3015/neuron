import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  browserZoneName,
  notSavedSentence,
  timezoneChoices,
  timezoneLabel,
  timezoneSaveOutcome,
  utcOffset,
} from './timezone.ts';

/* A day in October, when New York keeps summer time, and one in January, when it does not. */
const OCTOBER = new Date('2026-10-15T12:00:00.000Z');
const JANUARY = new Date('2026-01-15T12:00:00.000Z');

test('a zone is written with its distance from UTC at the moment given', () => {
  assert.equal(timezoneLabel('Asia/Karachi', OCTOBER), 'Asia/Karachi (UTC+5)');
  assert.equal(utcOffset('Asia/Kolkata', OCTOBER), 'UTC+5:30');
  assert.equal(utcOffset('America/St_Johns', JANUARY), 'UTC-3:30');
  assert.equal(utcOffset('UTC', OCTOBER), 'UTC+0');
});

test('the distance follows the clocks when they change for summer', () => {
  assert.equal(utcOffset('America/New_York', OCTOBER), 'UTC-4');
  assert.equal(utcOffset('America/New_York', JANUARY), 'UTC-5');
});

test('the list is the browser’s, in its order, and always holds the person’s own zone', () => {
  const zones = ['Africa/Abidjan', 'Asia/Karachi'];

  assert.deepEqual(
    timezoneChoices(zones, 'Asia/Karachi', OCTOBER).map((each) => each.value),
    ['Africa/Abidjan', 'Asia/Karachi'],
  );
  assert.deepEqual(timezoneChoices(zones, 'UTC', OCTOBER)[0], {
    value: 'UTC',
    label: 'UTC (UTC+0)',
    chosen: true,
  });
});

test('the person’s own zone is the one chosen, and only it', () => {
  const zones = ['Africa/Abidjan', 'Asia/Karachi'];

  assert.deepEqual(
    timezoneChoices(zones, 'Asia/Karachi', OCTOBER).map((each) => each.chosen),
    [false, true],
  );
});

test('a zone the browser lists under another name is listed once, under the browser’s name', () => {
  /* Firefox's list, and its naming: the API stored Node's name. */
  const zones = ['Asia/Karachi', 'Asia/Kolkata'];
  const firefox = (zone: string) =>
    zone === 'Asia/Calcutta' ? 'Asia/Kolkata' : zone;

  assert.deepEqual(
    timezoneChoices(zones, 'Asia/Calcutta', OCTOBER, firefox),
    [
      { value: 'Asia/Karachi', label: 'Asia/Karachi (UTC+5)', chosen: false },
      { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30)', chosen: true },
    ],
  );
});

test('a zone is added only when even the browser’s name for it is absent', () => {
  const zones = ['Asia/Karachi'];
  const firefox = (zone: string) =>
    zone === 'Asia/Calcutta' ? 'Asia/Kolkata' : zone;

  assert.deepEqual(
    timezoneChoices(zones, 'Asia/Calcutta', OCTOBER, firefox).map(
      (each) => [each.value, each.chosen],
    ),
    [
      ['Asia/Kolkata', true],
      ['Asia/Karachi', false],
    ],
  );
});

test('the browser’s name for a zone is its own, and a name it does not know is kept', () => {
  assert.equal(browserZoneName('Asia/Karachi'), 'Asia/Karachi');
  assert.equal(browserZoneName('Mars/Olympus'), 'Mars/Olympus');
});

test('an answer to Save timezone is one of five outcomes', () => {
  const user = {
    id: 'u1',
    email: 'a@b.test',
    name: 'A',
    createdAt: '2026-10-01T00:00:00.000Z',
    timezone: 'Asia/Tokyo',
  };

  assert.equal(timezoneSaveOutcome({ kind: 'ok', data: user }), 'saved');
  assert.equal(
    timezoneSaveOutcome({ kind: 'rejected', status: 400, messages: [] }),
    'refused',
  );
  assert.equal(
    timezoneSaveOutcome({ kind: 'rejected', status: 500, messages: [] }),
    'failed',
  );
  assert.equal(timezoneSaveOutcome({ kind: 'unreachable' }), 'unreachable');
  assert.equal(timezoneSaveOutcome({ kind: 'ended' }), 'ended');
});

test('a timezone that was not saved is said in a sentence that names the one still in use', () => {
  assert.equal(
    notSavedSentence('refused', 'Mars/Olympus', 'Asia/Karachi (UTC+5)'),
    'The server does not accept Mars/Olympus as a timezone. Your timezone is still Asia/Karachi (UTC+5). Choose another.',
  );
  assert.match(
    notSavedSentence('unreachable', 'Asia/Tokyo', 'Asia/Karachi (UTC+5)'),
    /^We could not reach the server\. Your timezone is still Asia\/Karachi \(UTC\+5\)\./,
  );
  assert.match(
    notSavedSentence('failed', 'Asia/Tokyo', 'Asia/Karachi (UTC+5)'),
    /^Something went wrong on our side\./,
  );
});
