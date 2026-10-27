import { Exclude } from 'class-transformer';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
@Index('UQ_users_email', { synchronize: false })
export class UserEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  /*
   * Unique, but the index that enforces it is on lower(email) and lives in
   * the migration rather than here: TypeORM's unique:true would emit a plain
   * index and let one mailbox hold two accounts. The class names it with
   * synchronize: false, so that migration:generate leaves it alone.
   */
  @Column({ type: 'text' })
  email!: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'created_at', type: 'text' })
  createdAt!: string;

  /* What the person is called on screen. Never used for signing in. */
  @Column({ type: 'text' })
  name!: string;

  /*
   * An IANA name such as Asia/Karachi. It decides which date an instant
   * falls on for this person (ADR-015), and it is read on every request that
   * needs a date, so it is loaded with the user.
   *
   * Sent with the user since feature 3, so that Account can show it.
   */
  @Column({ type: 'text' })
  timezone!: string;
}
