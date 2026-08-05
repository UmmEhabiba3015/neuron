import { DatabaseSync } from 'node:sqlite';
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../database/database.module';
import { JournalEntry } from './entry.interface';

// This is the only class in the application permitted to know that a database
// exists. The rules for anything added below (see ADR-004):
//
//   It may know:      the SQLite connection, the `entries` table, its column
//                     names, and how a row becomes a JournalEntry.
//   It must not know: anything about HTTP — no request objects, no status
//                     codes, no query parameters, no Nest HTTP exceptions. It
//                     has to stay callable from a test, a background job, or a
//                     script with no web server running.
//   What crosses:     JournalEntry objects out, plain values in. `EntryRow` is
//                     deliberately not exported and must never escape this
//                     file — the moment a caller can receive a raw row it has
//                     learned about the database, and the boundary is
//                     decorative.

// The database's own view of a row. It is not the same type as JournalEntry:
// SQL columns are snake_case, the HTTP contract is camelCase. Neither side is
// wrong, so neither side is bent to match — the translation happens here, in
// the one place that speaks both languages.
interface EntryRow {
  id: string;
  content: string;
  created_at: string;
}

@Injectable()
export class EntriesRepository {
  // `@Inject` is needed here and not on the service's `entriesRepository`
  // because DATABASE is a symbol, not a class. Nest infers dependencies from
  // the parameter's *type*, and `DatabaseSync` as a type says nothing about
  // which instance we want — so we name the token explicitly.
  constructor(@Inject(DATABASE) private readonly db: DatabaseSync) {}

  findAll(): JournalEntry[] {
    // Newest first. Sorting an ISO-8601 string lexicographically is the same
    // as sorting it chronologically, which is a large part of why the format
    // is stored as text rather than a number.
    //
    // Known limit: `createdAt` has millisecond resolution, so two entries
    // written in the same millisecond tie, and SQLite is free to return them
    // in either order. Left alone deliberately — a human cannot write two
    // journal entries in a millisecond, and the fixes (a SQLite-only `rowid`
    // tiebreaker, or a sequence column) either don't survive the move to
    // Postgres or buy determinism nobody has asked for yet.
    const rows = this.db
      .prepare(
        'SELECT id, content, created_at FROM entries ORDER BY created_at DESC',
      )
      // `.all()` is typed `Record<string, SQLOutputValue>[]` — SQLite doesn't
      // know at compile time what columns a query will produce, so the driver
      // can't promise more than "some row objects". The cast is us asserting
      // what the SELECT above already states. It is unchecked by definition:
      // change the column list and the type keeps lying until a test catches
      // it, which is one honest reason people reach for an ORM.
      .all() as unknown as EntryRow[];

    return rows.map(toJournalEntry);
  }

  // Returns `undefined` rather than throwing when the id matches nothing. "No
  // such row" is an ordinary storage outcome, not a failure — the query ran
  // correctly and the honest answer is that there is nothing there. Whether
  // that deserves a 404 is a question about HTTP, and this file is not allowed
  // to have an opinion about HTTP (ADR-004, ADR-005).
  findById(id: string): JournalEntry | undefined {
    const record = this.db
      .prepare('SELECT id, content, created_at FROM entries WHERE id = ?')
      .get(id) as EntryRow | undefined;

    // `undefined` in, `undefined` out. The mapper only runs on a real row,
    // which is what keeps the return type honest instead of asserting a
    // JournalEntry that was never found.
    return record ? toJournalEntry(record) : undefined;
  }

  findByContent(word: string): JournalEntry[] {
    const records = this.db
      .prepare(
        // `ESCAPE '\'` tells LIKE that a backslash in the pattern marks the
        // next character as ordinary text. SQLite has no escape character for
        // LIKE unless a query names one, so without this clause the backslashes
        // added by `escapeLikePattern` would themselves be matched literally.
        //
        // The quotes are SQL's, not JavaScript's: SQLite does not treat a
        // backslash as special inside a single-quoted string, so `'\'` is a
        // one-character string holding a backslash.
        `SELECT id, content, created_at FROM entries WHERE content LIKE ? ESCAPE '${LIKE_ESCAPE_CHARACTER}' ORDER BY created_at DESC`,
      )
      .all(`%${escapeLikePattern(word)}%`) as unknown as EntryRow[];

    // No empty-check on the way out, deliberately. A search that matched
    // nothing has a complete answer — the empty list — and `.map` over an
    // empty array already produces it. Adding a branch here would only be a
    // place for a future error to hide (ADR-005).
    return records.map(toJournalEntry);
  }

  countEntries(): number {
    const count = this.db
      .prepare('SELECT COUNT(*) as count FROM entries')
      .get() as { count: number };

    return count.count;
  }

  // Takes an already-complete entry and writes it. It generates nothing: `id`
  // and `createdAt` are decided by EntriesService, because neither
  // `crypto.randomUUID()` nor `new Date()` touches the database, and putting
  // them behind this boundary would weaken it without buying anything
  // (ADR-004, "Where id and createdAt are generated").
  save(entry: JournalEntry): void {
    // `?` placeholders with bound values, never string concatenation. The
    // difference is that a prepared statement sends the SQL and the data over
    // separate channels, so a value can never be parsed as SQL — content of
    // `'); DROP TABLE entries; --` is stored as that literal text. There is no
    // untrusted input here yet, but the habit is the defense; the day untrusted
    // input arrives is not the day to start remembering.
    this.db
      .prepare('INSERT INTO entries (id, content, created_at) VALUES (?, ?, ?)')
      .run(entry.id, entry.content, entry.createdAt);
  }

  // Returns the stored entry after the change, or `undefined` when no row has
  // that id — the same vocabulary `findById` uses, and for the same reason.
  // "There was nothing to update" is an ordinary storage outcome, and whether
  // it deserves a 404 is a question about HTTP that this file may not answer
  // (ADR-004, ADR-005).
  //
  // Only `content` is written. `id` identifies the row and `created_at` records
  // when the entry was written, not when it was last touched, so neither is
  // touched here — that is ADR-006's decision, and the `SET` clause is what
  // enforces it.
  update(id: string, content: string): JournalEntry | undefined {
    const result = this.db
      .prepare('UPDATE entries SET content = ? WHERE id = ?')
      .run(content, id);

    // `changes` counts the rows the statement matched. SQLite reports 1 even
    // when the new value equals the old one, so 0 means one thing only: no row
    // has this id.
    if (result.changes === 0) {
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
  delete(id: string): JournalEntry | undefined {
    const existing = this.findById(id);

    if (!existing) {
      return undefined;
    }

    this.db.prepare('DELETE FROM entries WHERE id = ?').run(id);

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
// This lives in the repository because it is a fact about how LIKE reads a
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

function toJournalEntry(row: EntryRow): JournalEntry {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
  };
}
