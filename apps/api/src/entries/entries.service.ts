import { Injectable } from '@nestjs/common';
import { EntriesRepository } from './entries.repository';
import { JournalEntry } from './entry.entity';

// Application logic, below the HTTP layer: no SQL, no TypeORM types, no
// request shapes, no status codes (ADR-005, ADR-010).
@Injectable()
export class EntriesService {
  constructor(private readonly entriesRepository: EntriesRepository) {}

  findAll(): Promise<JournalEntry[]> {
    return this.entriesRepository.findAll();
  }

  // `userId` is required rather than optional, so a caller cannot write an
  // ownerless entry by forgetting to pass one. Every route that reaches this
  // method is behind `JwtAuthGuard` as of Day 9, so an authenticated caller
  // always exists.
  //
  // This closes the set of NULL owners rather than growing it. The rows written
  // before today stay NULL and are Day 10's to backfill; nothing written from
  // now on joins them.
  async create(content: string, userId: string): Promise<JournalEntry> {
    const entry: JournalEntry = {
      // Generated here rather than by the repository or the schema because
      // neither call touches the database, and `createdAt` is product data
      // rather than storage bookkeeping (ADR-004).
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      userId,
    };

    await this.entriesRepository.save(entry);

    // Read back rather than returning the in-memory object, and the reason is
    // the one Day 8 wrote a test for. `userId` is `select: false`, which is a
    // *read-path* guarantee: it keeps the column out of every SELECT, so a
    // loaded entry has no owner on it. The object built above is not loaded —
    // it is the one just handed to `insert`, and it carries `userId` — so
    // returning it would put an owner in the 201 body and change the HTTP
    // contract by adding a column.
    //
    // The same shape as `@Exclude()` on `User.passwordHash`: the write path is
    // not covered by a protection that reads as total. Caught here by
    // `app.e2e-spec.ts` asserting the exact key list rather than one field.
    //
    // The non-null assertion is safe: the row was inserted on the line above,
    // and an `insert` that succeeded followed by a `findById` that finds
    // nothing would mean the database lost a committed write.
    return (await this.entriesRepository.findById(entry.id))!;
  }

  // `undefined` is passed through rather than raised as NotFoundException: a
  // status code is an instruction to write an HTTP response, and this service
  // must stay callable from a job or script (ADR-005).
  findById(id: string): Promise<JournalEntry | undefined> {
    return this.entriesRepository.findById(id);
  }

  findByContent(word: string): Promise<JournalEntry[]> {
    // `LIKE '%%'` matches every row, so an empty term would answer
    // `GET /entries?word=` with the whole journal (ADR-008).
    if (word === '') {
      return Promise.resolve([]);
    }

    return this.entriesRepository.findByContent(word);
  }

  // `createdAt` is deliberately not updatable: it records when the entry was
  // written, not when it was last edited (ADR-006).
  update(id: string, content: string): Promise<JournalEntry | undefined> {
    return this.entriesRepository.update(id, content);
  }

  delete(id: string): Promise<JournalEntry | undefined> {
    return this.entriesRepository.delete(id);
  }

  countEntries(): Promise<number> {
    return this.entriesRepository.countEntries();
  }
}
