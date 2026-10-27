import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'sessions' })
export class SessionEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Index('IDX_sessions_user_id')
  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_sessions_user',
  })
  user?: UserEntity;

  @Exclude()
  @Column({ name: 'refresh_token_hash', type: 'text' })
  refreshTokenHash!: string;

  @Column({ name: 'created_at', type: 'text' })
  createdAt!: string;

  @Index('IDX_sessions_expires_at')
  @Column({ name: 'expires_at', type: 'text' })
  expiresAt!: string;

  @Column({ name: 'revoked_at', type: 'text', nullable: true })
  revokedAt!: string | null;

  /*
   * The User-Agent header of the sign-in, exactly as it came. Null for a
   * session from before feature 3, and for a request that sent none. It
   * never leaves the API: the device's name is made from it when the
   * sessions are listed, and is not stored.
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  /* Set at sign-in and on every refresh. */
  @Column({ name: 'last_used_at', type: 'text' })
  lastUsedAt!: string;
}
