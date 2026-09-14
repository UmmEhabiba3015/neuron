import { Injectable } from '@nestjs/common';
import { EntriesRepository } from './entries.repository';
import { JournalEntry } from './entry.entity';

@Injectable()
export class EntriesService {
  constructor(private readonly entriesRepository: EntriesRepository) {}

  findAll(userId: string): Promise<JournalEntry[]> {
    return this.entriesRepository.findAll(userId);
  }

  async create(content: string, userId: string): Promise<JournalEntry> {
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      userId,
    };

    await this.entriesRepository.save(entry);

    return (await this.entriesRepository.findById(entry.id, userId))!;
  }

  findById(id: string, userId: string): Promise<JournalEntry | undefined> {
    return this.entriesRepository.findById(id, userId);
  }

  findByContent(word: string, userId: string): Promise<JournalEntry[]> {
    if (word === '') {
      return Promise.resolve([]);
    }

    return this.entriesRepository.findByContent(word, userId);
  }

  update(
    id: string,
    content: string,
    userId: string,
  ): Promise<JournalEntry | undefined> {
    return this.entriesRepository.update(id, content, userId);
  }

  delete(id: string, userId: string): Promise<JournalEntry | undefined> {
    return this.entriesRepository.delete(id, userId);
  }

  countEntries(userId: string): Promise<number> {
    return this.entriesRepository.countEntries(userId);
  }
}
