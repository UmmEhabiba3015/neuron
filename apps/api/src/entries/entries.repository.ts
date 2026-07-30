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

  findById(id: string): JournalEntry {
    const record = this.db
      .prepare('SELECT id, content, created_at FROM entries WHERE id = ?')
      .get(id) as EntryRow | undefined;

    // A plain Error, which Nest turns into a 500 where a 404 belongs. Known
    // wrong and preserved exactly as it was written, because mapping storage
    // outcomes onto HTTP status codes is Day 4's subject. Note that even the
    // fixed version cannot throw a Nest HTTP exception from this file — the
    // repository is not allowed to know what a status code is.
    if (!record) {
      throw new Error(`Entry with ID ${id} not found`);
    }

    return toJournalEntry(record);
  }

  findByContent(word: string): JournalEntry[] {
    const records = this.db
      .prepare(
        'SELECT id, content, created_at FROM entries WHERE content LIKE ? ORDER BY created_at DESC',
      )
      .all(`%${word}%`) as unknown as EntryRow[];

    // Also known wrong: "nothing matched a search" is an empty list and a 200,
    // not an error. Preserved unchanged for the same reason as above.
    if (!records.length) {
      throw new Error(`Entry with content ${word} not found`);
    }

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
}

function toJournalEntry(row: EntryRow): JournalEntry {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
  };
}
