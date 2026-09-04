import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ type: 'text' })
  id: string;

  // Deliberately not `unique`. Uniqueness only becomes meaningful once there
  // is a login, and Day 9 decides whether the identifier is a name at all.
  @Column({ type: 'text' })
  name: string;

  // No credential column yet — what goes here (hash, salt, algorithm marker)
  // is Day 9's decision. An empty `password` column would look answered.

  // Matches entries.created_at: ISO-8601 in TEXT, so ORDER BY sorts
  // chronologically.
  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;
}
