import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  FIRST_REAL_TEST_DAY,
  NOT_BUILT_YET,
  NOT_SCHEDULED,
  UNBUILT,
  unscheduled,
} from './unbuilt.ts';

test('the sentence is the one the owner chose', () => {
  assert.equal(NOT_BUILT_YET, 'This is not built yet.');
});

/*
 * A control with no day yet cannot be checked against Day 36, so it is named
 * in every failure here: a late day is read beside what is still unplaced.
 */
test('every scheduled unbuilt control is wired before a real person tests the product', () => {
  const entries = Object.entries(UNBUILT);
  const waiting = `Not scheduled yet: ${unscheduled().join(', ') || 'none'}.`;

  assert.ok(entries.length > 0);

  for (const [name, control] of entries) {
    if (control.day === NOT_SCHEDULED) {
      continue;
    }

    assert.ok(Number.isInteger(control.day), `${name}. ${waiting}`);
    assert.ok(
      control.day >= 18,
      `${name} is wired on day ${control.day}. ${waiting}`,
    );
    assert.ok(
      control.day < FIRST_REAL_TEST_DAY,
      `${name} is wired on day ${control.day}. ${waiting}`,
    );
  }
});

test('the controls with no day are the ones the owner has not placed', () => {
  assert.deepEqual(unscheduled(), [
    'training',
    'startRecording',
    'entryMemory',
    'composerMemory',
    'supportResource',
  ]);
});

test('every unbuilt control has a name on screen and a screen it is on', () => {
  for (const [name, control] of Object.entries(UNBUILT)) {
    assert.ok(control.label.trim().length > 0, name);
    assert.ok(control.where.trim().length > 0, name);
  }
});

test('no two unbuilt controls on one screen share a name', () => {
  const seen = new Set<string>();

  for (const control of Object.values(UNBUILT)) {
    const key = `${control.where} / ${control.label}`;

    assert.ok(!seen.has(key), key);
    seen.add(key);
  }
});

test('the list is the one the owner decided, each on its day', () => {
  const days = Object.fromEntries(
    Object.entries(UNBUILT).map(([name, control]) => [name, control.day]),
  );

  assert.deepEqual(days, {
    editEntry: 18,
    sendResetLink: 20,
    saveNewPassword: 20,
    signedInDevices: 34,
    signOutEverywhere: 34,
    chooseTimezone: 34,
    exportEverything: 34,
    deleteAccount: 34,
    keepingSince: 34,
    whatLeaves: 22,
    whoProcesses: 22,
    training: NOT_SCHEDULED,
    modelCanRead: 22,
    modelCannotRead: 22,
    ask: 25,
    startRecording: NOT_SCHEDULED,
    entryMemory: NOT_SCHEDULED,
    composerMemory: NOT_SCHEDULED,
    supportResource: NOT_SCHEDULED,
  });
});
