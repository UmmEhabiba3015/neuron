import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { JournalEntry } from './entry.entity';

@Injectable()
export class EntriesRepository {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly entries: Repository<JournalEntry>,
  ) {}

  findAll(): Promise<JournalEntry[]> {
    return this.entries.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<JournalEntry | undefined> {
    return (await this.entries.findOneBy({ id })) ?? undefined;
  }

  findByContent(word: string): Promise<JournalEntry[]> {
    return this.entries.find({
      where: {
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
    await this.entries.insert(entry);
  }

  async update(id: string, content: string): Promise<JournalEntry | undefined> {
    const result = await this.entries.update({ id }, { content });

    if (result.affected === 0) {
      return undefined;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<JournalEntry | undefined> {
    const existing = await this.findById(id);

    if (!existing) {
      return undefined;
    }

    await this.entries.delete({ id });

    return existing;
  }
}

const LIKE_ESCAPE_CHARACTER = '\\';

function escapeLikePattern(term: string): string {
  return term
    .replaceAll(
      LIKE_ESCAPE_CHARACTER,
      LIKE_ESCAPE_CHARACTER + LIKE_ESCAPE_CHARACTER,
    )
    .replaceAll('%', LIKE_ESCAPE_CHARACTER + '%')
    .replaceAll('_', LIKE_ESCAPE_CHARACTER + '_');
}
