import type { DayEntity } from '../../days/entities/day.entity';
import type { EntryEntity } from '../entities/entry.entity';

/*
 * An entry as it is read: with the date of the day it points at, and nothing
 * else of that day. The date is the stored one. It is never worked out from
 * createdAt, because the rule that would be used today is not always the
 * rule that filed the entry (ADR-015).
 */
export type FiledEntry = EntryEntity & { day: Pick<DayEntity, 'date'> };
