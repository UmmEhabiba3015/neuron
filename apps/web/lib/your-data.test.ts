import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  COUNT_PATHS,
  FALLBACK_FILENAME,
  countsFrom,
  countsLine,
  exportOutcome,
  exportStart,
  filenameFrom,
  isAfterDelete,
  keepingSince,
  notDeletedSentence,
} from './your-data.ts';

test('entries and recordings are counted apart, by kind', () => {
  assert.equal(COUNT_PATHS.entries, '/entries/count?kind=Text');
  assert.equal(COUNT_PATHS.recordings, '/entries/count?kind=Voice');
});

test('the counts are said with their nouns, in the singular for one', () => {
  assert.equal(countsLine({ entries: 12, recordings: 3 }), '12 entries, 3 recordings');
  assert.equal(countsLine({ entries: 1, recordings: 1 }), '1 entry, 1 recording');
  assert.equal(countsLine({ entries: 0, recordings: 0 }), '0 entries, 0 recordings');
});

test('the counts are both answers or nothing', () => {
  const ok = (count: number) => ({ kind: 'ok' as const, data: { count } });

  assert.deepEqual(countsFrom(ok(12), ok(3)), { entries: 12, recordings: 3 });
  assert.equal(countsFrom(ok(12), { kind: 'unreachable' }), null);
  assert.equal(
    countsFrom({ kind: 'rejected', status: 500, messages: [] }, ok(3)),
    null,
  );
});

test('an empty account sends nothing, and an account not yet counted asks', () => {
  assert.equal(exportStart({ entries: 0, recordings: 0 }), 'nothing');
  assert.equal(exportStart({ entries: 0, recordings: 1 }), 'send');
  assert.equal(exportStart({ entries: 1, recordings: 0 }), 'send');
  assert.equal(exportStart(null), 'send');
});

test("the file is named by the API's answer, never by the browser's clock", () => {
  assert.equal(
    filenameFrom('attachment; filename="neuron-export-2026-10-17.zip"'),
    'neuron-export-2026-10-17.zip',
  );
  assert.equal(filenameFrom(null), FALLBACK_FILENAME);
  assert.equal(filenameFrom('attachment'), FALLBACK_FILENAME);
});

test('an answer to the export is ready, unreachable, failed or ended', () => {
  const blob = new Blob(['zip']);

  assert.deepEqual(
    exportOutcome({
      kind: 'ok',
      data: { blob, disposition: 'attachment; filename="neuron-export-2026-10-17.zip"' },
    }),
    { kind: 'ready', blob, filename: 'neuron-export-2026-10-17.zip' },
  );
  assert.deepEqual(exportOutcome({ kind: 'unreachable' }), { kind: 'unreachable' });
  assert.deepEqual(
    exportOutcome({ kind: 'rejected', status: 500, messages: [] }),
    { kind: 'failed' },
  );
  assert.deepEqual(exportOutcome({ kind: 'ended' }), { kind: 'ended' });
});

test('a delete that did not happen says so, and why', () => {
  assert.equal(
    notDeletedSentence('wrongPassword'),
    'That password is not right. Your account has not been deleted.',
  );
  assert.match(notDeletedSentence('unreachable')!, /could not reach the server/);
  assert.match(notDeletedSentence('failed')!, /has not been deleted/);
  assert.equal(notDeletedSentence('deleted'), null);
  assert.equal(notDeletedSentence('ended'), null);
});

test('sign in says the account was deleted only for the mark it is sent', () => {
  assert.equal(isAfterDelete('done'), true);
  assert.equal(isAfterDelete(undefined), false);
  assert.equal(isAfterDelete(['done', 'done']), false);
});

test('the journal is kept since the month the account was made, in the person’s timezone', () => {
  assert.equal(
    keepingSince('2026-10-16T09:00:00.000Z', 'Asia/Karachi'),
    'since October 2026',
  );
  /* 20:00Z on 30 September is already 1 October in Karachi, and not in New York. */
  assert.equal(
    keepingSince('2026-09-30T20:00:00.000Z', 'Asia/Karachi'),
    'since October 2026',
  );
  assert.equal(
    keepingSince('2026-09-30T20:00:00.000Z', 'America/New_York'),
    'since September 2026',
  );
});
