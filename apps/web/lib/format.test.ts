import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatDay } from './format.ts';

test('a date is written the way the date box shows it', () => {
  assert.equal(formatDay('2026-08-09'), "Sun 9 Aug '26");
  assert.equal(formatDay('2026-10-06'), "Tue 6 Oct '26");
});

test('the first and last day of a year keep their own date', () => {
  assert.equal(formatDay('2026-01-01'), "Thu 1 Jan '26");
  assert.equal(formatDay('2026-12-31'), "Thu 31 Dec '26");
});
