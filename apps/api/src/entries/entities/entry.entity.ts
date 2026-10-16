import { EntryKind } from '@neuron/contracts';
import {
  Check,
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

/*
 * A typed entry has words and no audio. A voice memo has its audio's key,
 * type and length, and may have no words (ADR-023). The database refuses
 * any row that is neither, so a memo without its audio cannot be written.
 */
@Entity({ name: 'entries' })
@Check(
  'CHK_entries_kind',
  `("kind" = 'Text' AND "content" IS NOT NULL AND "audio_key" IS NULL AND "audio_type" IS NULL AND "duration_ms" IS NULL) OR ("kind" = 'Voice' AND "audio_key" IS NOT NULL AND "audio_type" IS NOT NULL AND "duration_ms" IS NOT NULL)`,
)
export class EntryEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  /*
   * Every entry written before voice memos is a typed one, and so is any
   * row that does not say, which is what the default is for.
   */
  @Column({ type: 'text', default: EntryKind.Text })
  kind!: EntryKind;

  /* null only for a voice memo that has no transcript yet. */
  @Column({ type: 'text', nullable: true })
  content!: string | null;

  /*
   * The name AudioStorage keeps the memo's file under: a random id, never
   * anything the person sent. It never leaves the API, so it is not read
   * unless asked for, and neither is the type.
   */
  @Column({ name: 'audio_key', type: 'text', nullable: true, select: false })
  audioKey?: string | null;

  /* The audio's MIME type as it was recorded, codec included. */
  @Column({ name: 'audio_type', type: 'text', nullable: true, select: false })
  audioType?: string | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

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
