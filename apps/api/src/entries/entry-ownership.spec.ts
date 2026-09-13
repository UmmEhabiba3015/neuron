import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../../test/test-database';
import { User } from '../users/user.entity';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.entity';

// Ownership, as the schema and the entity express it today — which is to say
// completely, and used by nothing.
//
// No endpoint reads or writes `user_id`. The API still has no idea who is
// asking; that is Day 9 (registration and login) and Day 10 (enforcement).
// Today's task makes ownership *expressible*, and the whole risk of a task
// shaped like that is that the column ends up existing in the database and in
// no test — present, plausible, and never once demonstrated to work. That is
// exactly the gap this file closes, and it is the reason it talks to the
// DataSource directly rather than going through `EntriesService`: there is no
// service method to call, because the decision was that there should not be one
// yet.
//
// The schema under test is built by the migrations, through
// `createTestDataSource`. So these are claims about what
// `AddUsersAndEntryOwnership` actually produced, not about what the entity
// classes say it should have — a distinction that matters, because those two
// are exactly what `synchronize: false` keeps separate.
describe('entry ownership', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  // `PRAGMA table_info` is SQLite's own description of a table: one row per
  // column, in declaration order, with `notnull` and `pk` as 0/1. Reading the
  // database's answer rather than the entity's is the point — an assertion made
  // against the decorators would agree with itself no matter what the migration
  // did.
  //
  // The row shape goes on `query<...>` rather than on an `as` after it.
  // `query` is declared `query<T = any>`, so a trailing assertion is one
  // `eslint --fix` reads as unnecessary and silently deletes — which it did,
  // once, leaving every caller below unpacking `any`. Naming the type argument
  // is the same claim in a place nothing rewrites.
  const columnsOf = (table: string) =>
    dataSource.query<
      { name: string; type: string; notnull: number; pk: number }[]
    >(`PRAGMA table_info(${table})`);

  describe('the users table', () => {
    // The exact list, not `toContain`. `toContain` would pass on a table that
    // had grown a column nobody decided on, and the thing this test is most
    // useful for saying is what is *absent*.
    it('should have exactly id, name, created_at and password_hash', async () => {
      expect((await columnsOf('users')).map((column) => column.name)).toEqual([
        'id',
        'name',
        'created_at',
        'password_hash',
      ]);
    });

    // Day 9 made the decision this test used to record the absence of. ADR-009
    // named a `password` column "for completeness" and said it would not
    // survive Day 9; ADR-011 says what replaced it and why.
    //
    // Still one test of its own, and still stated as a decision rather than a
    // consequence: there is exactly **one** credential column, never a
    // `password`, and never a separate `salt`. argon2 stores the algorithm, its
    // version, the cost parameters, the salt and the hash in a single PHC
    // string, so splitting them would mean re-gluing the pieces on every verify
    // and would strand the cost parameters — which have to rise as hardware
    // gets faster — outside the row that was created with them.
    it('should store the credential as one column and never a plaintext password', async () => {
      const names = (await columnsOf('users')).map((column) => column.name);

      expect(names).toContain('password_hash');
      expect(names).not.toContain('password');
      expect(names).not.toContain('salt');
    });

    // `notnull: 0`, and deliberately so. This column was added to a table that
    // already existed, and a row written before it had no password — nullable
    // says that truthfully. The alternative that satisfies a NOT NULL
    // constraint is `DEFAULT ''`, which is worse: it invents a credential that
    // nothing can verify and that `argon2.verify` will happily be asked about.
    //
    // The application reads a null hash as an account that cannot log in.
    //
    // This is also the assertion that would have caught the generated
    // migration. `migration:generate` produced `password_hash text NOT NULL`
    // followed by a row copy that supplied no value for it — which passes on an
    // empty table and fails the moment one user exists.
    it('should allow the credential to be null for rows that predate it', async () => {
      const passwordHash = (await columnsOf('users')).find(
        (column) => column.name === 'password_hash',
      );

      expect(passwordHash?.notnull).toBe(0);
    });

    // Day 9 is the day this test pointed at. `name` is what a person
    // authenticates *as*, so two users called "habiba" would leave login with a
    // choice to make and no basis for making it.
    //
    // Asserted against the database rather than against `UsersService`, because
    // the service's duplicate check is a read followed by a write and two
    // concurrent registrations can both pass it. **The index is the guard**;
    // the service's check only makes the ordinary path produce a clean 409.
    it('should require names to be unique', async () => {
      const users = dataSource.getRepository(User);

      await users.insert({
        id: 'user-1',
        name: 'habiba',
        createdAt: '2026-09-02T09:00:00.000Z',
      });

      await expect(
        users.insert({
          id: 'user-2',
          name: 'habiba',
          createdAt: '2026-09-02T09:00:01.000Z',
        }),
      ).rejects.toThrow(/UNIQUE constraint failed/);
    });
  });

  describe('the user_id column on entries', () => {
    it('should exist and be nullable', async () => {
      const userId = (await columnsOf('entries')).find(
        (column) => column.name === 'user_id',
      );

      expect(userId).toBeDefined();
      expect(userId?.type).toBe('TEXT');
      // `notnull: 0`, and this is the deliberate half. No user can exist until
      // registration arrives on Day 9, so `NOT NULL` today would need either a
      // fictional placeholder owner or the deletion of every entry already
      // written. Expand, backfill, contract is the staged shape, and Day 10
      // performs the contract once ownership is enforced and every row has one.
      expect(userId?.notnull).toBe(0);
    });

    // `PRAGMA foreign_key_list` is the constraint as SQLite stored it. Without
    // the `@ManyToOne` and `@JoinColumn` on the entity this is an empty list
    // and `user_id` is a plain TEXT column that merely looks like a reference.
    it('should be a foreign key pointing at users.id', async () => {
      const foreignKeys = await dataSource.query<
        { table: string; from: string; to: string }[]
      >(`PRAGMA foreign_key_list(entries)`);

      expect(foreignKeys).toEqual([
        expect.objectContaining({ table: 'users', from: 'user_id', to: 'id' }),
      ]);
    });

    // The question worth asking about any foreign key in SQLite, because the
    // answer is not always yes: SQLite enforces them only when
    // `PRAGMA foreign_keys` is ON, and it is OFF by default in the library.
    // TypeORM's better-sqlite3 driver turns it on for every connection it
    // opens, which is what makes the constraint above a rule rather than a
    // comment with extra steps — and this asserts on the behaviour rather than
    // on the pragma, so it stays true if TypeORM ever changes how it does that.
    it('should actually be enforced, not merely declared', async () => {
      await expect(
        dataSource.getRepository(JournalEntry).insert({
          id: 'entry-1',
          content: 'owned by nobody who exists',
          createdAt: '2026-09-02T09:00:00.000Z',
          userId: 'no-such-user',
        }),
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });
  });

  describe('writing and reading an owner', () => {
    // The claim that makes the column real. Everything above would still pass
    // if the entity had no idea `user_id` existed — the schema comes from the
    // migration either way — so this is the one that says the application can
    // put an owner in and get the same owner back.
    it('should round-trip an owner through the entity', async () => {
      await dataSource.getRepository(User).insert({
        id: 'user-1',
        name: 'habiba',
        createdAt: '2026-09-02T09:00:00.000Z',
      });

      const entries = dataSource.getRepository(JournalEntry);

      await entries.insert({
        id: 'entry-1',
        content: 'mine',
        createdAt: '2026-09-02T09:00:01.000Z',
        userId: 'user-1',
      });

      // `select` names `userId` explicitly, which is the whole cost of
      // `select: false` on the entity: a query that wants the owner has to ask
      // for it. That is the intended shape while no response body is allowed to
      // carry one.
      const stored = await entries.find({ select: { id: true, userId: true } });

      expect(stored).toEqual([{ id: 'entry-1', userId: 'user-1' }]);
    });

    // Every entry in every existing database is in this state, and will be
    // until Day 9 produces the first user. NULL rather than an empty string or
    // a placeholder id: "this entry has no owner" is a different fact from
    // "this entry is owned by nobody-in-particular", and only one of them can
    // be told apart from a bug later.
    it('should store NULL when nothing says who owns the entry', async () => {
      const entries = dataSource.getRepository(JournalEntry);

      await entries.insert({
        id: 'entry-1',
        content: 'written the way every entry is written today',
        createdAt: '2026-09-02T09:00:00.000Z',
      });

      const rows = await dataSource.query<{ user_id: string | null }[]>(
        `SELECT user_id FROM entries`,
      );

      expect(rows).toEqual([{ user_id: null }]);
    });
  });

  // The guarantee the rest of this task rests on: adding a column changed no
  // response body.
  //
  // It is not automatic, and the natural way to write the entity breaks it. A
  // plain `@Column({ name: 'user_id' })` goes into every SELECT TypeORM writes,
  // so every entity it loads carries `userId: null`, and `JSON.stringify` puts
  // that straight into the response:
  //
  //   {"id":"…","content":"…","createdAt":"…","userId":null}
  //
  // `select: false` is what stops it, and this asserts on the exact key list so
  // that removing the option is a failure rather than a surprise in production.
  describe('the shape an entry is read back in', () => {
    it('should carry no owner, because nothing has asked for one', async () => {
      const entries = dataSource.getRepository(JournalEntry);

      await entries.insert({
        id: 'entry-1',
        content: 'anything',
        createdAt: '2026-09-02T09:00:00.000Z',
        userId: null,
      });

      const [found] = await entries.find();

      // The claim is made *after* serialization, and that is not a shortcut —
      // it is where the guarantee actually lives.
      //
      // TypeORM hands back a real `JournalEntry` instance, so the object owns
      // every property the class declares. `Object.keys(found)` is
      // `['id', 'content', 'createdAt', 'userId', 'user']` right now, with the
      // last two sitting there as `undefined` because nothing selected them.
      // `JSON.stringify` omits an `undefined` property and keeps a `null` one,
      // and that single rule is the entire difference between a response body
      // that changed today and one that did not. Take `select: false` off the
      // column and `userId` arrives as `null` instead of absent, survives
      // serialization, and this goes red on four keys.
      //
      // `Object.keys` rather than `toEqual` against a literal, because
      // `toEqual` ignores properties whose value is `undefined` and would pass
      // on exactly the object this is trying to rule out.
      const serialized = JSON.parse(JSON.stringify(found)) as object;

      expect(Object.keys(serialized)).toEqual(['id', 'content', 'createdAt']);
    });
  });

  // Day 9 made the caller's id a required argument to `EntriesService.create`,
  // so an authenticated write records its owner. Asserted against the column
  // rather than against the returned entry, because `select: false` means a
  // loaded entry never carries one — the value is in the database and not in
  // any response body, which is exactly the arrangement Day 10 builds on.
  describe('ownership on write', () => {
    it('should record the caller as the owner of a new entry', async () => {
      await dataSource.getRepository(User).insert({
        id: 'owner-1',
        name: 'the-owner',
        createdAt: '2026-09-01T00:00:00.000Z',
        passwordHash: null,
      });

      const service = new EntriesService(
        new EntriesRepository(dataSource.getRepository(JournalEntry)),
      );

      const created = await service.create('an owned entry', 'owner-1');

      // The column holds the owner...
      const [row] = await dataSource.query<{ user_id: string | null }[]>(
        `SELECT user_id FROM entries WHERE id = '${created.id}'`,
      );
      expect(row.user_id).toBe('owner-1');

      // ...and the entry handed back to the caller does not, because nothing
      // selected it. Both halves matter: the first is the feature, the second
      // is the HTTP contract staying exactly as it was.
      expect(created.userId).toBeUndefined();
    });
  });
});
