import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ type: 'text' })
  id: string;

  /*
   * Unique, but the index that enforces it is on lower(email) and lives in
   * the migration rather than here: TypeORM's unique:true would emit a plain
   * index and let one mailbox hold two accounts.
   */
  @Column({ type: 'text' })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;
}
