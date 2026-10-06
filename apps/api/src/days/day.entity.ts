import type { Mood } from '@neuron/contracts';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'days' })
export class Day {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  date: string;

  @Column({ type: 'text', nullable: true })
  mood!: Mood | null;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;

  @Column({ name: 'user_id', type: 'text', select: false })
  userId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
