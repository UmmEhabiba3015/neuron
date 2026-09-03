import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';

// The shape of a single journal entry, as returned over HTTP — and, since
// Day 8, also the description of the `entries` table. It was an interface
// until TypeORM arrived; an interface has no runtime existence, and TypeORM
// needs a runtime object to attach column metadata to, so it is a class now.
//
// Nothing about the HTTP contract moved with it. The three fields, their
// names and their types are exactly what they were, which is why every test
// that asserts on a response body is untouched.
//
// Kept intentionally minimal: mood and tags are later days' problems (see the
// roadmap). Adding fields here before a real feature needs them is exactly the
// kind of speculative modeling this project is trying to avoid.
//
// Ownership arrived today and is the one exception, which is worth stating
// rather than glossing: nothing reads it. ADR-009's finding was that no column
// in this table could hold the answer to "whose entry is this?", so even a
// server that knew perfectly well who was asking would have nowhere to look.
// The column below is that place. Checking it against a request is Day 10.
@Entity({ name: 'entries' })
export class JournalEntry {
  // `@PrimaryColumn`, not `@PrimaryGeneratedColumn`. The id is a v4 UUID
  // decided by `EntriesService` before the row is written, because generating
  // it needs no coordination with the database (ADR-004, "Where id and
  // createdAt are generated"). A generated column would move that decision
  // into storage and change what a POST response can promise.
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  content: string;

  // The whole of the snake_case/camelCase mapping, in one place. SQL columns
  // are snake_case, the HTTP contract is camelCase, neither side is wrong, and
  // the translation is stated rather than resolved by renaming one of them.
  // Until today it lived in a hand-written `toJournalEntry` inside the
  // repository; `name:` is the same decision expressed to a different reader.
  //
  // `type: 'text'` is load-bearing and must not be "improved" into a date
  // type. `createdAt` is an ISO-8601 string on the wire and an ISO-8601 string
  // in the column, which is what lets `ORDER BY created_at` sort
  // chronologically by sorting lexicographically — and what lets a database
  // written by yesterday's `node:sqlite` code still be read today.
  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;

  // Ownership, expressible and not yet expressed.
  //
  // **`select: false` is the load-bearing option and it is not a performance
  // hint.** Without it TypeORM puts `user_id` in every SELECT it writes, so
  // every entity it loads carries `userId: null`, and `JSON.stringify` puts
  // that straight into the response body:
  //
  //   {"id":"…","content":"…","createdAt":"…","userId":null}
  //
  // That is a change to the HTTP contract, made by adding a column. This task
  // is required to change nothing observable, so the column is declared and
  // deliberately not selected: `find`, `findOneBy` and everything built on them
  // return objects with no `userId` property at all, and the response bodies
  // are byte-for-byte what they were yesterday. Verified by an assertion on the
  // exact key list, not by looking at one.
  //
  // It is a real restriction rather than a trick. Day 10 enforces ownership,
  // and on that day reading this column becomes something a query has to ask
  // for by name — `addSelect`, or removing this option once a response is
  // *meant* to carry an owner. A column nothing selects cannot leak into a body
  // by accident, which is the property worth having while the API still has no
  // idea who is asking.
  //
  // Optional in the type because all three states are real and different:
  // absent (loaded without being selected, which is every read today), `null`
  // (selected, and the entry has no owner — every row that exists right now),
  // and a string (selected, and owned).
  @Column({ name: 'user_id', type: 'text', nullable: true, select: false })
  userId?: string | null;

  // The relation, and the only reason the schema gets a FOREIGN KEY rather than
  // a lone TEXT column that happens to be called `user_id`. `@Column` above
  // describes the column; `@ManyToOne` + `@JoinColumn` on the same column name
  // is what makes TypeORM emit
  // `FOREIGN KEY ("user_id") REFERENCES "users" ("id")`. Declaring one without
  // the other is the mistake that produces a "foreign key" nothing in the
  // database has ever heard of.
  //
  // "Many entries to one user" is the direction ADR-009 settled, and the rule
  // it generalised: the pointer lives on the "many" side. The first sketch put
  // an `entries` column on `users`, and the correction was to ask what that
  // cell would literally contain for a person with three entries. There is no
  // inverse `@OneToMany` on `User` for the same reason — a list is never stored
  // in a cell, and nothing needs to walk the relation backwards yet.
  //
  // Not loaded unless a query joins it, so the property is simply absent from
  // every entity this application reads today. Same guarantee as `select:
  // false` above, arrived at differently.
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
