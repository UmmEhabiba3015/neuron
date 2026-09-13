import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ type: 'text' })
  id: string;

  // Unique as of Day 9, which is the day the comment here used to point at:
  // uniqueness only becomes meaningful once a name is what someone
  // authenticates *as*, and `findByName` has to return one row rather than a
  // choice.
  //
  // The constraint is in the database rather than only in `UsersService`,
  // because the service's `findByName` check is a read followed by a write and
  // two concurrent registrations can both pass it before either inserts. The
  // pre-check is an optimisation that produces a clean 409 on the ordinary
  // path; **this index is the actual guard**, and `UsersService.register`
  // catches the constraint violation so the loser of that race gets the same
  // 409 rather than a 500.
  @Column({ type: 'text', unique: true })
  name: string;

  // One column, not three. ADR-009 sketched "hash, salt, algorithm marker" as
  // separate things, and argon2 puts all of them in a single PHC string:
  //
  //   $argon2id$v=19$m=65536,p=4,t=3$<salt>$<hash>
  //    algorithm  version  parameters  salt   hash
  //
  // Splitting it would mean re-gluing the pieces in the right order and
  // encoding on every verify, whose only job would be to undo the schema
  // decision. Worse, the cost parameters travel *with each hash*: hardware gets
  // faster, so `m` and `t` have to rise over time, and a row that records what
  // it was created with keeps verifying while new rows use stronger settings.
  // Parameters living only in code would invalidate every stored password the
  // day they changed.
  //
  // `@Exclude()` rather than `select: false`, and the difference is the whole
  // reason this is not a copy of `entries.user_id`. `select: false` is a
  // *read-path* guarantee: it keeps a column out of the SELECT, so `findOne`
  // never carries it. Registration does not read. `repo.save(user)` hands back
  // the same in-memory object it was given, credential included, and returning
  // that from a controller serialises the hash straight into a 201 body with
  // `select: false` doing nothing at all. Verified before this line was
  // written.
  //
  // Its limit is worth stating too: `@Exclude()` acts on `User` *instances*, so
  // a plain object from `ds.query()` or `getRawMany()` is not covered. The test
  // in `auth.e2e-spec.ts` asserts on response bodies rather than on this
  // decorator for that reason — the same division as Day 8's `synchronize`
  // repair, where the durable claim was about behaviour rather than about a
  // setting.
  //
  // Nullable, and the type says so. A row written before this column existed
  // has no password, and the application reads that as an account that cannot
  // log in — which is the honest meaning rather than a state to paper over with
  // an empty string.
  @Exclude()
  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash!: string | null;

  // Matches entries.created_at: ISO-8601 in TEXT, so ORDER BY sorts
  // chronologically.
  @Column({ name: 'created_at', type: 'text' })
  createdAt: string;
}
