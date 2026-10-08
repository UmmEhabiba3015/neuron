import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Day } from '../days/day.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'entries' })
export class JournalEntry {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;

  @Column({ name: 'user_id', type: 'text', select: false })
  userId?: string;

  @Index('IDX_entries_day_id')
  @Column({ name: 'day_id', type: 'text', select: false })
  dayId?: string;

  /*
   * Empty means alive, a time means deleted (ADR-020). The decorator makes
   * every find and count leave deleted rows out. It does nothing for an
   * update, and nothing for raw SQL: those carry the condition themselves.
   *
   * The value is written by EntriesRepository.markDeleted and never by
   * TypeORM's softDelete, which would write the database's own clock in the
   * database's own format.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'text',
    nullable: true,
    select: false,
  })
  deletedAt?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_entries_user' })
  user?: User;

  @ManyToOne(() => Day)
  @JoinColumn({ name: 'day_id', foreignKeyConstraintName: 'FK_entries_day' })
  day?: Day;
}

/*
 * An entry as it is read: with the date of the day it points at, and nothing
 * else of that day. The date is the stored one. It is never worked out from
 * createdAt, because the rule that would be used today is not always the
 * rule that filed the entry (ADR-015).
 */
export type FiledEntry = JournalEntry & { day: Pick<Day, 'date'> };
