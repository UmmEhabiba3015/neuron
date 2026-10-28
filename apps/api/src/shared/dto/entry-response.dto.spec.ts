import { EntryKind } from '@neuron/contracts';
import type { FiledEntry } from '../types/filed-entry.type';
import { EntryResponseDto } from './entry-response.dto';

describe('EntryResponseDto', () => {
  /* Everything an entity read could be carrying, and more than it should. */
  const filed = {
    id: 'entry-1',
    kind: EntryKind.Text,
    content: 'walked the canal',
    durationMs: null,
    createdAt: '2026-10-08T05:00:00.000Z',
    userId: 'user-1',
    dayId: 'day-1',
    deletedAt: null,
    audioKey: null,
    audioType: null,
    keptOutOfMemory: false,
    day: { date: '2026-10-07', id: 'day-1', userId: 'user-1' },
  } as unknown as FiledEntry;

  const memo = {
    ...filed,
    id: 'memo-1',
    kind: EntryKind.Voice,
    content: null,
    durationMs: 72_000,
    audioKey: '0b7f2a52-41f6-4d38-9a5e-1c2d3e4f5a6b',
    audioType: 'audio/webm;codecs=opus',
    keptOutOfMemory: true,
  } as unknown as FiledEntry;

  it('carries the id, the kind, the content, the length, when it was written, the date of its day and whether it is kept out of memory, in that order', () => {
    expect(new EntryResponseDto(filed)).toEqual({
      id: 'entry-1',
      kind: EntryKind.Text,
      content: 'walked the canal',
      durationMs: null,
      createdAt: '2026-10-08T05:00:00.000Z',
      date: '2026-10-07',
      keptOutOfMemory: false,
    });
    expect(Object.keys(new EntryResponseDto(filed))).toEqual([
      'id',
      'kind',
      'content',
      'durationMs',
      'createdAt',
      'date',
      'keptOutOfMemory',
    ]);
  });

  it('carries a voice memo with no words, its length and its mark', () => {
    expect(new EntryResponseDto(memo)).toEqual({
      id: 'memo-1',
      kind: EntryKind.Voice,
      content: null,
      durationMs: 72_000,
      createdAt: '2026-10-08T05:00:00.000Z',
      date: '2026-10-07',
      keptOutOfMemory: true,
    });
  });

  it('takes the date from the day, not from createdAt', () => {
    expect(new EntryResponseDto(filed).date).toBe('2026-10-07');
  });

  it('carries no owner, no day row, no deletion and no audio key or type', () => {
    for (const entry of [filed, memo]) {
      expect(JSON.stringify(new EntryResponseDto(entry))).not.toMatch(
        /user|day|deleted|audio/i,
      );
    }
  });
});
