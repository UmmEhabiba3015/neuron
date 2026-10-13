import type { FiledEntry } from '../types/filed-entry.type';
import { EntryResponseDto } from './entry-response.dto';

describe('EntryResponseDto', () => {
  /* Everything an entity read could be carrying, and more than it should. */
  const filed = {
    id: 'entry-1',
    content: 'walked the canal',
    createdAt: '2026-10-08T05:00:00.000Z',
    userId: 'user-1',
    dayId: 'day-1',
    deletedAt: null,
    day: { date: '2026-10-07', id: 'day-1', userId: 'user-1' },
  } as unknown as FiledEntry;

  it('carries the id, the content, when it was written and the date of its day, in that order', () => {
    expect(new EntryResponseDto(filed)).toEqual({
      id: 'entry-1',
      content: 'walked the canal',
      createdAt: '2026-10-08T05:00:00.000Z',
      date: '2026-10-07',
    });
    expect(Object.keys(new EntryResponseDto(filed))).toEqual([
      'id',
      'content',
      'createdAt',
      'date',
    ]);
  });

  it('takes the date from the day, not from createdAt', () => {
    expect(new EntryResponseDto(filed).date).toBe('2026-10-07');
  });

  it('carries no owner, no day row and no deletion', () => {
    expect(JSON.stringify(new EntryResponseDto(filed))).not.toMatch(
      /user|day|deleted/i,
    );
  });
});
