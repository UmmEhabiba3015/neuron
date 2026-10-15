import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

/*
 * One request to reset a password, which is one link sent by email.
 *
 * The token itself is never stored, only its SHA-256 hash, as with a
 * session's refresh token: a copy of this table opens no account. A reset
 * works once, until `expiresAt`; `usedAt` is when it stopped working,
 * because it was used or because another reset of the same person was.
 */
@Entity({ name: 'password_resets' })
export class PasswordResetEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'text' })
  expiresAt!: string;

  @Column({ name: 'used_at', type: 'text', nullable: true })
  usedAt!: string | null;

  @Column({ name: 'created_at', type: 'text' })
  createdAt!: string;
}
