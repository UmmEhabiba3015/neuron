import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { JournalEntry } from './entry.entity';

// The only class permitted to know a database exists. It must not learn about
// HTTP, and TypeORM's `Repository` must never escape this file (ADR-004).
@Injectable()
export class EntriesRepository {
  // The decorator is required because `Repository<JournalEntry>` is a generic
  // whose type argument is erased at runtime, so Nest cannot infer the token.
  constructor(
    @InjectRepository(JournalEntry)
    private readonly entries: Repository<JournalEntry>,
  ) {}

  findAll(): Promise<JournalEntry[]> {
    // `createdAt`, not `created_at`: the clause names the property and TypeORM
    // maps it to the column.
    return this.entries.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<JournalEntry | undefined> {
    // TypeORM says "not found" with null; this application says undefined, and
    // has since Day 3.
    return (await this.entries.findOneBy({ id })) ?? undefined;
  }

  findByContent(word: string): Promise<JournalEntry[]> {
    return this.entries.find({
      where: {
        // `Raw` rather than `Like()` solely for the ESCAPE clause: `Like()`
        // emits `content LIKE ?` with no escape character defined, so the
        // backslashes added below would match as literal backslashes and a
        // search for `100%` would find nothing.
        content: Raw(
          (alias) => `${alias} LIKE :pattern ESCAPE '${LIKE_ESCAPE_CHARACTER}'`,
          { pattern: `%${escapeLikePattern(word)}%` },
        ),
      },
      order: { createdAt: 'DESC' },
    });
  }

  countEntries(): Promise<number> {
    return this.entries.count();
  }

  async save(entry: JournalEntry): Promise<void> {
    // `insert`, not `save`. TypeORM's `save()` turns an existing id into an
    // UPDATE, so a duplicate id would quietly overwrite somebody's entry.
    await this.entries.insert(entry);
  }

  async update(id: string, content: string): Promise<JournalEntry | undefined> {
    const result = await this.entries.update({ id }, { content });

    // SQLite reports 1 even when the new value equals the old, so 0 means one
    // thing only: no row has this id.
    if (result.affected === 0) {
      return undefined;
    }

    // Read back rather than returning a hand-assembled object, so the caller
    // gets what the database actually holds (ADR-005).
    return this.findById(id);
  }

  async delete(id: string): Promise<JournalEntry | undefined> {
    // The read is what distinguishes "deleted" from "there was nothing there":
    // a DELETE alone succeeds quietly against an id that never existed.
    const existing = await this.findById(id);

    if (!existing) {
      return undefined;
    }

    await this.entries.delete({ id });

    return existing;
  }
}

// A bound parameter stops a value being parsed as SQL, but `%` and `_` are not
// SQL grammar — they are LIKE's pattern language, read *after* binding. An ORM
// removes the SQL you write, not the SQL that runs (ADR-006).
const LIKE_ESCAPE_CHARACTER = '\\';

// The order of these three replacements is the whole correctness of this
// function, and reversing it fails silently. The escape character must go
// first: the later passes add backslashes, and a backslash pass running after
// them would double those and turn each escape marker back into a literal
// backslash followed by a live wildcard.
//
//   '100%'  --%-->  '100\%'  --\-->  '100\\%'
//
// which LIKE reads as "100, a literal backslash, then anything".
function escapeLikePattern(term: string): string {
  return term
    .replaceAll(
      LIKE_ESCAPE_CHARACTER,
      LIKE_ESCAPE_CHARACTER + LIKE_ESCAPE_CHARACTER,
    )
    .replaceAll('%', LIKE_ESCAPE_CHARACTER + '%')
    .replaceAll('_', LIKE_ESCAPE_CHARACTER + '_');
}
