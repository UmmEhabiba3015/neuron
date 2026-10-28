import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EntryKind } from '@neuron/contracts';
import {
  KEEP_OUT_LABEL,
  createMemoryTick,
  memoryMenuOf,
  tickOf,
  inMemoryQuestion,
} from './memory.ts';

const TYPED_IN = { kind: EntryKind.Text, keptOutOfMemory: false };
const TYPED_OUT = { kind: EntryKind.Text, keptOutOfMemory: true };
const MEMO_OUT = { kind: EntryKind.Voice, keptOutOfMemory: true };
const RESTING = { saving: false, heard: false };

test('the tick is pressed when on, and has one label', () => {
  assert.deepEqual(tickOf(false), { pressed: false, label: KEEP_OUT_LABEL });
  assert.deepEqual(tickOf(true), { pressed: true, label: KEEP_OUT_LABEL });
  assert.equal(KEEP_OUT_LABEL, 'Keep this out of memory');
});

test('an entry in memory says so, and has no option', () => {
  assert.deepEqual(memoryMenuOf(TYPED_IN, RESTING), {
    excluded: false,
    trigger: 'In memory',
    ariaLabel: 'Entry memory settings: in memory',
    note: 'This entry is in memory.',
    line: undefined,
  });
});

test('an entry kept out has one option, "Use in memory"', () => {
  assert.deepEqual(memoryMenuOf(TYPED_OUT, RESTING), {
    excluded: true,
    trigger: 'Kept out of memory',
    ariaLabel: 'Entry memory settings: kept out of memory',
    option: { label: 'Use in memory', disabled: false },
    line: undefined,
    problem: undefined,
  });
});

test('a voice memo is named as one', () => {
  const menu = memoryMenuOf(MEMO_OUT, { ...RESTING, notSaved: 'refused' });

  assert.equal(menu.ariaLabel, 'Voice memo memory settings: kept out of memory');
  assert.equal(
    menu.problem,
    'Something went wrong on our side. The change was not saved. This voice memo is still kept out of memory.',
  );
  assert.equal(
    inMemoryQuestion(MEMO_OUT),
    'Use this voice memo in memory? This cannot be undone.',
  );
});

test('while it is being put in memory, the option is disabled and the row says so', () => {
  const menu = memoryMenuOf(TYPED_OUT, { saving: true, heard: false });

  assert.deepEqual(menu.option, { label: 'Use in memory', disabled: true });
  assert.deepEqual(menu.line, { text: 'Putting it in memory.', hidden: false });
});

test('a failure says the change was not saved, and the entry is still kept out', () => {
  const menu = memoryMenuOf(TYPED_OUT, { ...RESTING, notSaved: 'unreachable' });

  assert.equal(menu.excluded, true);
  assert.equal(
    menu.problem,
    'We could not reach the server. The change was not saved. This entry is still kept out of memory.',
  );
});

test('once it is in memory, a screen reader is told, in a line only it reads', () => {
  assert.deepEqual(memoryMenuOf(TYPED_IN, { saving: false, heard: true }).line, {
    text: 'This entry is in memory now.',
    hidden: true,
  });
});

test('the question says it cannot be undone', () => {
  assert.equal(
    inMemoryQuestion(TYPED_OUT),
    'Use this entry in memory? This cannot be undone.',
  );
});

test('the tick on Talk turns on and off, and taking it gives its value and turns it off', () => {
  const tick = createMemoryTick();
  let heard = 0;
  tick.subscribe(() => {
    heard += 1;
  });

  assert.equal(tick.getState(), false);
  assert.equal(tick.take(), false);
  assert.equal(heard, 0, 'taking it while off changes nothing');

  tick.toggle();
  assert.equal(tick.getState(), true);
  assert.equal(tick.take(), true);
  assert.equal(tick.getState(), false);
  assert.equal(tick.take(), false, 'the next memo starts in memory');
  assert.equal(heard, 2);
});
