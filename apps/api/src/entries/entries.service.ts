import { Injectable } from '@nestjs/common';
import { EntriesRepository } from './entries.repository';
import { JournalEntry } from './entry.entity';

@Injectable()
export class EntriesService {
  constructor(private readonly entriesRepository: EntriesRepository) {}

  findAll(): Promise<JournalEntry[]> {
    return this.entriesRepository.findAll();
  }

  async create(content: string, userId: string): Promise<JournalEntry> {
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      userId,
    };

    await this.entriesRepository.save(entry);

    return (await this.entriesRepository.findById(entry.id))!;
  }

  findById(id: string): Promise<JournalEntry | undefined> {
    return this.entriesRepository.findById(id);
  }

  findByContent(word: string): Promise<JournalEntry[]> {
    if (word === '') {
      return Promise.resolve([]);
    }

    return this.entriesRepository.findByContent(word);
  }

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
