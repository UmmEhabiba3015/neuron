import {
  Column,
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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_entries_user' })
  user?: User;

  @ManyToOne(() => Day)
  @JoinColumn({ name: 'day_id', foreignKeyConstraintName: 'FK_entries_day' })
  day?: Day;
}
