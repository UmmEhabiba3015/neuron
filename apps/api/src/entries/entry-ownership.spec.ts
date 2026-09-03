import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../../test/test-database';
import { User } from '../users/user.entity';
import { JournalEntry } from './entry.interface';

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
    it('should have exactly id, name and created_at', async () => {
      expect((await columnsOf('users')).map((column) => column.name)).toEqual([
        'id',
        'name',
        'created_at',
      ]);
    });

    // Stated as its own test because it is a decision rather than a
    // consequence, and a decision that will be tempting to undo on Day 9
    // without reading why.
    //
    // ADR-009 named a `password` column "for completeness" and said in the same
    // paragraph that it will not survive Day 9, whose entire problem is that
    // storing a password is a liability. What replaces it — a hash, an
    // algorithm marker, a salt, more than one column — is that day's decision
    // and it has not been made. A column added now would be a column whose
    // contents are undecided, and it would read as answered to the next person
    // who opened the schema (ADR-006: a missing constraint is usually a missing
    // decision).
    it('should have no credential column yet', async () => {
      const names = (await columnsOf('users')).map((column) => column.name);

      expect(names).not.toContain('password');
      expect(names).not.toContain('password_hash');
    });

    // `name` is deliberately not unique. Two users called "habiba" is obviously
    // wrong, and it is only obviously wrong once there is a login — uniqueness
    // is what makes a name identify one person to authenticate as, and login is
    // Day 9. That day also gets to say whether the identifier is a name at all.
    // This test exists so the constraint's absence is a recorded choice rather
    // than something nobody got round to.
    it('should not yet require names to be unique', async () => {
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
      ).resolves.toBeDefined();
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
});
