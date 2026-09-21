import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ name: 'user_id', type: 'text' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Exclude()
  @Column({ name: 'refresh_token_hash', type: 'text' })
  refreshTokenHash: string;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;

  @Column({ name: 'expires_at', type: 'text' })
  expiresAt: string;

  @Column({ name: 'revoked_at', type: 'text', nullable: true })
  revokedAt!: string | null;
}
