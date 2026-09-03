import { Column, Entity, PrimaryColumn } from 'typeorm';

// The second table this project has, and the first one that exists before
// anything can write to it. No endpoint creates a user yet — registration is
// Day 9 — so `users` is empty on every database in the world today. That is
// deliberate: ADR-009 decided the shape of ownership, and a shape has to exist
// in the schema before a request can be checked against it.
//
// The file is `user.entity.ts` rather than `user.interface.ts`. `JournalEntry`
// still lives in `entry.interface.ts` and stopped being an interface on Day 8;
// renaming it is a pending item from that day's report and is not done here,
// because a rename touching every import would bury the schema change this task
// is actually about.
@Entity({ name: 'users' })
export class User {
  // A v4 UUID chosen by the application, exactly as `JournalEntry.id` is, and
  // for the same reason (ADR-004): generating it needs no coordination with the
  // database, so it can exist before the row does. `@PrimaryColumn` rather than
  // `@PrimaryGeneratedColumn` is what keeps that decision out of storage.
  @PrimaryColumn({ type: 'text' })
  id: string;

  // Not `unique`, and that is a decision rather than an oversight.
  //
  // Two users called "habiba" is obviously wrong — but it is only obviously
  // wrong once there is a login, because uniqueness is what makes a name
  // identify one person to authenticate as. Login is Day 9, and that is the day
  // that gets to say whether the identifier is a name at all, or an email, or
  // something else. Declaring `unique` today would freeze that answer a day
  // early and would have to be un-frozen with another migration if Day 9
  // disagreed (ADR-006: a missing constraint is usually a missing decision).
  @Column({ type: 'text' })
  name: string;

  // **There is no credential column, deliberately.** ADR-009 named `password`
  // "for completeness" and said in the same paragraph that it will not survive
  // Day 9, whose whole problem is that storing a password is a liability. What
  // goes here — a hash, an algorithm marker, a salt, several columns — is Day
  // 9's decision and it has not been made.
  //
  // Adding the column now, empty, would be a column whose contents are
  // undecided, and it would look answered to whoever read the schema next.

  // TEXT holding an ISO-8601 string, matching `entries.created_at` exactly.
  // That is what lets `ORDER BY` sort chronologically by sorting
  // lexicographically, and it is the same reason it must not be "improved"
  // into a date type — see the note on `JournalEntry.createdAt`.
  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;
}
