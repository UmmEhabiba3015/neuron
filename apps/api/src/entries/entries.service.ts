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

  async create(content: string): Promise<JournalEntry> {
    const entry: JournalEntry = {
      // Generated here rather than by the repository or the schema because
      // neither call touches the database, and `createdAt` is product data
      // rather than storage bookkeeping (ADR-004).
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
    };

    await this.entriesRepository.save(entry);

    return entry;
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
