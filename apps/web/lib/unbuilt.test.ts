import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FIRST_REAL_TEST_FEATURE, NOT_BUILT_YET, UNBUILT } from './unbuilt.ts';

test('the sentence is the one the owner chose', () => {
  assert.equal(NOT_BUILT_YET, 'This is not built yet.');
});

/*
 * Every control has a feature, so every one is checked: a control wired in
 * feature 16 or later would still be unbuilt when a real person tests the
 * product.
 */
test('every unbuilt control is wired before a real person tests the product', () => {
  const entries = Object.entries(UNBUILT);

  assert.ok(entries.length > 0);

  for (const [name, control] of entries) {
    assert.ok(Number.isInteger(control.feature), name);
    assert.ok(
      control.feature >= 1,
      `${name} is wired in feature ${control.feature}`,
    );
    assert.ok(
      control.feature < FIRST_REAL_TEST_FEATURE,
      `${name} is wired in feature ${control.feature}`,
    );
  }
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

test('the list is the one the owner decided, each in its feature', () => {
  const features = Object.fromEntries(
    Object.entries(UNBUILT).map(([name, control]) => [name, control.feature]),
  );

  assert.deepEqual(features, {
    whatLeaves: 15,
    whoProcesses: 15,
    training: 15,
    modelCanRead: 12,
    modelCannotRead: 12,
    ask: 12,
    entryMemory: 9,
    composerMemory: 9,
    supportResource: 15,
  });
});
