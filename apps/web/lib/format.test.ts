import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatDay,
  formatDayOfMonth,
  formatLongDay,
  formatMonth,
  isCalendarDate,
  monthOf,
} from './format.ts';

test('a date is written the way the date box shows it', () => {
  assert.equal(formatDay('2026-08-09'), "Sun 9 Aug '26");
  assert.equal(formatDay('2026-10-06'), "Tue 6 Oct '26");
});

test('the first and last day of a year keep their own date', () => {
  assert.equal(formatDay('2026-01-01'), "Thu 1 Jan '26");
  assert.equal(formatDay('2026-12-31'), "Thu 31 Dec '26");
});

test('a calendar date is four digits, two and two, and a day that exists', () => {
  for (const date of ['2026-08-06', '2024-02-29', '2026-12-31', '1999-01-01']) {
    assert.equal(isCalendarDate(date), true, date);
  }

  for (const text of [
    '',
    'today',
    '2026-8-6',
    '26-08-06',
    '2026-02-29',
    '2026-02-31',
    '2026-00-10',
    '2026-13-01',
    '2026-08-00',
    '2026-08-32',
    '2026-08-06T00:00',
    ' 2026-08-06',
    '2026/08/06',
  ]) {
    assert.equal(isCalendarDate(text), false, text);
  }
});

test('a month heading and a day label are made from the date`s own text', () => {
  assert.equal(monthOf('2026-08-09'), '2026-08');
  assert.equal(formatMonth('2026-08'), 'August 2026');
  assert.equal(formatMonth('2026-01'), 'January 2026');
  assert.equal(formatMonth('2025-12'), 'December 2025');
  assert.equal(formatDayOfMonth('2026-08-09'), 'Sun 9');
  assert.equal(formatDayOfMonth('2026-08-31'), 'Mon 31');
  assert.equal(formatLongDay('2026-08-09'), 'Sunday 9 August 2026');
});

test('the first and the last day of a month stay in their own month, whatever the timezone of this machine', () => {
  assert.equal(formatDayOfMonth('2026-08-01'), 'Sat 1');
  assert.equal(formatLongDay('2026-08-01'), 'Saturday 1 August 2026');
  assert.equal(formatLongDay('2026-07-31'), 'Friday 31 July 2026');
});
