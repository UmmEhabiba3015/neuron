import { Mood } from '@neuron/contracts';
import type { DayEntity } from '../entities/day.entity';
import { DayResponseDto } from './day-response.dto';

describe('DayResponseDto', () => {
  it('carries the date and the mood, and not the row id or the owner', () => {
    const day = {
      id: 'day-1',
      date: '2026-08-09',
      mood: Mood.Even,
      createdAt: '2026-08-09T12:00:00.000Z',
      userId: 'user-1',
    } as DayEntity;

    expect(new DayResponseDto(day)).toEqual({
      date: '2026-08-09',
      mood: 'Even',
    });
    expect(Object.keys(new DayResponseDto(day))).toEqual(['date', 'mood']);
  });

  it('answers a day that has no row from its date and no mood', () => {
    expect(new DayResponseDto({ date: '2020-01-01', mood: null })).toEqual({
      date: '2020-01-01',
      mood: null,
    });
  });
});
