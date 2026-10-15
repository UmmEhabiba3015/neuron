import assert from 'node:assert/strict';
import { test } from 'node:test';

import { enterSaves, escapeCloses, TOUCH_ONLY } from './keys.ts';

const computer = { shiftKey: false, isComposing: false, touchOnly: false };
const phone = { ...computer, touchOnly: true };

test('on a computer, Enter saves', () => {
  assert.equal(enterSaves({ ...computer, key: 'Enter' }), true);
});

test('on a computer, Shift with Enter starts a new line and does not save', () => {
  assert.equal(enterSaves({ ...computer, key: 'Enter', shiftKey: true }), false);
});

test('on a phone, Enter starts a new line and does not save', () => {
  assert.equal(enterSaves({ ...phone, key: 'Enter' }), false);
});

test('on a phone, Shift with Enter does not save either', () => {
  assert.equal(enterSaves({ ...phone, key: 'Enter', shiftKey: true }), false);
});

test('Enter while a word is being composed never saves, on a computer or a phone', () => {
  assert.equal(enterSaves({ ...computer, key: 'Enter', isComposing: true }), false);
  assert.equal(enterSaves({ ...phone, key: 'Enter', isComposing: true }), false);
});

test('a key that is not Enter never saves', () => {
  for (const key of ['a', ' ', 'Tab', 'Escape', 'NumpadEnter']) {
    assert.equal(enterSaves({ ...computer, key }), false, key);
  }
});

test('Escape closes the editor', () => {
  assert.equal(escapeCloses({ key: 'Escape', shiftKey: false, isComposing: false }), true);
});

test('Escape that ends the composition of a word does not close the editor', () => {
  assert.equal(escapeCloses({ key: 'Escape', shiftKey: false, isComposing: true }), false);
});

test('a key that is not Escape does not close the editor', () => {
  assert.equal(escapeCloses({ key: 'Enter', shiftKey: false, isComposing: false }), false);
});

test('a phone is a screen that cannot hover and is touched with a finger', () => {
  assert.equal(TOUCH_ONLY, '(hover: none) and (pointer: coarse)');
});
