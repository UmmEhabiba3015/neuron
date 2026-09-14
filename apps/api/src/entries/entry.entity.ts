import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'entries' })
export class JournalEntry {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;

  @Column({ name: 'user_id', type: 'text', nullable: true, select: false })
  userId?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
