import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { JournalEntry } from './entry.interface';

// This is the only class in the application permitted to know that a database
// exists. The rules for anything added below (see ADR-004):
//
//   It may know:      the TypeORM connection, the `entries` table, its column
//                     names, and how `LIKE` reads a pattern.
//   It must not know: anything about HTTP — no request objects, no status
//                     codes, no query parameters, no Nest HTTP exceptions. It
//                     has to stay callable from a test, a background job, or a
//                     script with no web server running.
//   What crosses:     JournalEntry objects out, plain values in. TypeORM's own
//                     `Repository` is an implementation detail *inside* this
//                     file and must never escape it — the moment a caller can
//                     receive one it has learned about the database, and the
//                     boundary is decorative (ADR-010).
//
// The private `EntryRow` interface and the `toJournalEntry` mapper that used to
// live at the bottom of this file are gone. They translated `created_at` into
// `createdAt`; that translation is now the `name: 'created_at'` on the entity's
// `@Column`. It did not disappear, it moved — and it is still stated in exactly
// one place, which was the whole point of writing it by hand.

@Injectable()
export class EntriesRepository {
  // `@InjectRepository` is needed here, and nothing like it is needed on the
  // service's `entriesRepository`, for the same reason `@Inject(DATABASE)`
  // used to be: Nest infers dependencies from a parameter's *type*, and
  // `Repository<JournalEntry>` is a generic whose type argument is erased at
  // runtime. The decorator names the token — `getRepositoryToken(JournalEntry)`
  // — that `TypeOrmModule.forFeature([JournalEntry])` registered.
  constructor(
    @InjectRepository(JournalEntry)
    private readonly entries: Repository<JournalEntry>,
  ) {}

  // Every method below returns a Promise, and that is TypeORM's doing rather
  // than a design choice. `better-sqlite3` is synchronous underneath, but
  // TypeORM has no synchronous API at all, so the whole call chain above this
  // file — service, then controller — became async with it. Nothing observable
  // changed: Nest awaits whatever a handler returns, so the status codes and
  // bodies are identical. What changed is the TypeScript signature, and the
  // tests that call these methods now `await` them.
  findAll(): Promise<JournalEntry[]> {
    // Newest first. Sorting an ISO-8601 string lexicographically is the same
    // as sorting it chronologically, which is a large part of why the format
    // is stored as text rather than a number.
    //
    // `createdAt`, not `created_at`: the order clause names the *property*, and
    // TypeORM translates it to the column through the entity's `@Column({ name
    // })`. Writing the column name here would be an error the compiler catches.
    //
    // Known limit: `createdAt` has millisecond resolution, so two entries
    // written in the same millisecond tie, and SQLite is free to return them
    // in either order. Left alone deliberately — a human cannot write two
    // journal entries in a millisecond, and the fixes (a SQLite-only `rowid`
    // tiebreaker, or a sequence column) either don't survive the move to
    // Postgres or buy determinism nobody has asked for yet.
    return this.entries.find({ order: { createdAt: 'DESC' } });
  }

  // Returns `undefined` rather than throwing when the id matches nothing. "No
  // such row" is an ordinary storage outcome, not a failure — the query ran
  // correctly and the honest answer is that there is nothing there. Whether
  // that deserves a 404 is a question about HTTP, and this file is not allowed
  // to have an opinion about HTTP (ADR-004, ADR-005).
  async findById(id: string): Promise<JournalEntry | undefined> {
    // TypeORM says "nothing found" with `null`; this application says it with
    // `undefined`, and has done since Day 3. The `??` is the whole of that
    // translation, and it is here rather than anywhere else because converting
    // the storage layer's vocabulary into this application's is precisely what
    // this file is for. Without it `expect(...).toBeUndefined()` fails and,
    // worse, `!entry` in the controller would still be true — so the tests
    // would go red on the type while the status codes stayed right.
    return (await this.entries.findOneBy({ id })) ?? undefined;
  }

  findByContent(word: string): Promise<JournalEntry[]> {
    return this.entries.find({
      where: {
        // `Raw` rather than TypeORM's `Like()`, and the difference is the
        // `ESCAPE` clause. `Like('%100\\%%')` produces `content LIKE ?` and
        // nothing else — SQLite then has no escape character defined for that
        // pattern, so the backslashes `escapeLikePattern` added are matched as
        // literal backslashes and the search for `100%` finds nothing.
        // TypeORM does not escape LIKE patterns for you; it cannot, because it
        // has no way to know whether a `%` in a value was meant as a wildcard.
        //
        // `alias` is the quoted column TypeORM would have written itself. The
        // quotes around the escape character are SQL's, not JavaScript's:
        // SQLite does not treat a backslash as special inside a single-quoted
        // string, so `'\'` is a one-character string holding a backslash.
        content: Raw(
          (alias) => `${alias} LIKE :pattern ESCAPE '${LIKE_ESCAPE_CHARACTER}'`,
          { pattern: `%${escapeLikePattern(word)}%` },
        ),
      },
      // The clause a copy-paste dropped on Day 3, leaving `/entries` and
      // `/entries?word=…` returning the same resource in two different orders.
      // It is pinned by a test now, which is the actual repair.
      order: { createdAt: 'DESC' },
    });

    // No empty-check on the way out, deliberately. A search that matched
    // nothing has a complete answer — the empty list — and TypeORM already
    // returns it. Adding a branch here would only be a place for a future
    // error to hide (ADR-005).
  }

  countEntries(): Promise<number> {
    return this.entries.count();
  }

  // Takes an already-complete entry and writes it. It generates nothing: `id`
  // and `createdAt` are decided by EntriesService, because neither
  // `crypto.randomUUID()` nor `new Date()` touches the database, and putting
  // them behind this boundary would weaken it without buying anything
  // (ADR-004, "Where id and createdAt are generated").
  async save(entry: JournalEntry): Promise<void> {
    // `insert`, not `save`. TypeORM's `save()` reads the row first and turns
    // an existing id into an UPDATE — an upsert wearing the same name as the
    // method on this class. `insert()` issues the INSERT and nothing else,
    // which is what the hand-written statement did, so a duplicate id still
    // fails loudly instead of quietly overwriting somebody's entry.
    //
    // The values are still bound parameters rather than concatenated text:
    // TypeORM builds `VALUES (?, ?, ?)` exactly as the hand-written statement
    // did, so content of `'); DROP TABLE entries; --` is stored as that
    // literal text. Pinned by a test that has been there since Day 3.
    await this.entries.insert(entry);
  }

  // Returns the stored entry after the change, or `undefined` when no row has
  // that id — the same vocabulary `findById` uses, and for the same reason.
  // "There was nothing to update" is an ordinary storage outcome, and whether
  // it deserves a 404 is a question about HTTP that this file may not answer
  // (ADR-004, ADR-005).
  //
  // Only `content` is written. `id` identifies the row and `created_at` records
  // when the entry was written, not when it was last touched, so neither is
  // touched here — that is ADR-006's decision, and the second argument below is
  // what enforces it.
  async update(id: string, content: string): Promise<JournalEntry | undefined> {
    const result = await this.entries.update({ id }, { content });

    // `affected` is TypeORM's name for the row count the statement matched —
    // the `changes` the hand-written version read. SQLite reports 1 even when
    // the new value equals the old one, so 0 means one thing only: no row has
    // this id.
    if (result.affected === 0) {
      return undefined;
    }

    // Read back rather than returning a hand-assembled object. What the caller
    // gets is then what the database actually holds, which is the difference
    // that ADR-005 records: a POST response echoing its input claimed
    // `"content": 42` while every later GET returned `"content": "42"`.
    return this.findById(id);
  }

  // Reads the row before removing it, because the entry cannot be reported
  // after it is gone. The read is also what distinguishes "deleted" from "there
  // was nothing there" — a `DELETE` alone succeeds quietly against an id that
  // never existed.
  async delete(id: string): Promise<JournalEntry | undefined> {
    const existing = await this.findById(id);

    if (!existing) {
      return undefined;
    }

    await this.entries.delete({ id });

    return existing;
  }
}

// LIKE's pattern language, and the reason a bound parameter does not protect
// against it. A prepared statement keeps a value from being parsed as SQL, and
// that works exactly as intended here — but `%` and `_` are not SQL grammar.
// They are the pattern language LIKE itself interprets, *after* the value has
// been bound, which is precisely where user input lands. `?word=%` therefore
// returned every entry in the journal, and `100%` could not be searched for at
// all (ADR-006).
//
// None of that changed when TypeORM arrived, and it is worth being explicit
// about why: an ORM removes the SQL you write, not the SQL that runs. `Like()`
// and `Raw()` both hand the pattern straight to the database. The escaping
// stayed the repository's job because it is a fact about how LIKE reads a
// pattern, and that is database vocabulary. The caller passes ordinary text and
// never learns that a pattern language exists.
const LIKE_ESCAPE_CHARACTER = '\\';

// The order of these three replacements is the whole correctness of the
// function, and getting it wrong fails silently.
//
// The escape character must be escaped FIRST. Each later replacement introduces
// new backslashes; if the backslash pass ran after them, it would double the
// backslashes it had just added and turn each escape marker back into a literal
// backslash followed by a live wildcard.
//
// Searching for `100%`, with the order reversed:
//
//   '100%'  --%-->  '100\%'  --\-->  '100\\%'
//
// which LIKE reads as "the text 100, then a literal backslash, then any run of
// characters" — so `100% exhausted today` no longer matches, and an entry
// containing `100\` would.
//
// The two ways to get this wrong fail differently, which is why the tests cover
// both. Escaping in the wrong *order* breaks searches for `%` and `_` and
// leaves a search for a backslash working. *Omitting* the backslash pass
// altogether does the reverse: `%` and `_` behave correctly, and a search for a
// backslash silently returns entries containing a percent sign instead, because
// the lone `\` in the pattern is read as marking the character after it.
function escapeLikePattern(term: string): string {
  return term
    .replaceAll(
      LIKE_ESCAPE_CHARACTER,
      LIKE_ESCAPE_CHARACTER + LIKE_ESCAPE_CHARACTER,
    )
    .replaceAll('%', LIKE_ESCAPE_CHARACTER + '%')
    .replaceAll('_', LIKE_ESCAPE_CHARACTER + '_');
}
