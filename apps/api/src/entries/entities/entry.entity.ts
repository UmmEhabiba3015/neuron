import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { DayEntity } from '../../days/entities/day.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'entries' })
export class EntryEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'created_at', type: 'text' })
  createdAt!: string;

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

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_entries_user' })
  user?: UserEntity;

  @ManyToOne(() => DayEntity)
  @JoinColumn({ name: 'day_id', foreignKeyConstraintName: 'FK_entries_day' })
  day?: DayEntity;
}
