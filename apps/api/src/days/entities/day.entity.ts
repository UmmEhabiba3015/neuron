import type { Mood } from '@neuron/contracts';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

/*
 * The indexes and the key are named as the migration names them, so that
 * migration:generate compares like with like. IDX_days_user_date sorts the
 * date descending, which TypeORM cannot declare, so it is synchronize: false:
 * TypeORM leaves it alone and the migration alone makes it.
 */
@Entity({ name: 'days' })
@Index('UQ_days_user_date', ['userId', 'date'], { unique: true })
@Index('IDX_days_user_date', { synchronize: false })
export class DayEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  date!: string;

  @Column({ type: 'text', nullable: true })
  mood!: Mood | null;

  @Column({ name: 'created_at', type: 'text' })
  createdAt!: string;

  @Column({ name: 'user_id', type: 'text', select: false })
  userId?: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_days_user' })
  user?: UserEntity;
}
