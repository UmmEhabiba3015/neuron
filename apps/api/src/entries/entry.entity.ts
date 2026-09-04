import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'entries' })
export class JournalEntry {
  // Not `@PrimaryGeneratedColumn`: the UUID is chosen by EntriesService before
  // the row is written (ADR-004).
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  content: string;

  // `text`, not a date type. ORDER BY sorts these lexicographically, and
  // ISO-8601 is what makes that chronological.
  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;

  // `select: false` is not a performance hint: without it TypeORM adds
  // `user_id` to every SELECT and `userId: null` appears in every response
  // body. Day 10 must opt in explicitly with `addSelect`.
  @Column({ name: 'user_id', type: 'text', nullable: true, select: false })
  userId?: string | null;

  // `@Column` above describes the column; this pair is what makes TypeORM emit
  // the FOREIGN KEY. Declaring one without the other gives a "foreign key" the
  // database has never heard of.
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
