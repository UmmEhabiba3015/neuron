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

  findAll(userId: string): Promise<JournalEntry[]> {
    return this.entries.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<JournalEntry | undefined> {
    return (await this.entries.findOneBy({ id, userId })) ?? undefined;
  }

  findByContent(word: string, userId: string): Promise<JournalEntry[]> {
    return this.entries.find({
      where: {
        userId,
        content: Raw(
          (alias) => `${alias} LIKE :pattern ESCAPE '${LIKE_ESCAPE_CHARACTER}'`,
          { pattern: `%${escapeLikePattern(word)}%` },
        ),
      },
      order: { createdAt: 'DESC' },
    });
  }

  countEntries(userId: string): Promise<number> {
    return this.entries.count({ where: { userId } });
  }

  async save(entry: JournalEntry): Promise<void> {
    await this.entries.insert(entry);
  }

  async update(
    id: string,
    content: string,
    userId: string,
  ): Promise<JournalEntry | undefined> {
    const result = await this.entries.update({ id, userId }, { content });

    if (result.affected === 0) {
      return undefined;
    }

    return this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<JournalEntry | undefined> {
    const existing = await this.findById(id, userId);

    if (!existing) {
      return undefined;
    }

    const result = await this.entries.delete({ id, userId });

    if (result.affected === 0) {
      return undefined;
    }

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
