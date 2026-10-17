import { Injectable } from '@nestjs/common';
import { EntryKind } from '@neuron/contracts';
import { DataSource } from 'typeorm';
import type { DayOwner } from '../days/day-boundary';
import { DaysService } from '../days/days.service';
import { AudioStorage } from './audio-storage';
import { EntriesRepository } from './entries.repository';
import { EntryEntity } from './entities/entry.entity';
import type { FiledEntry } from '../shared/types/filed-entry.type';
import type { AudioRecording } from './types/audio-recording.interface';
import type { EntryFilters } from './types/entry-filters.interface';
import type { StoredAudio } from './types/stored-audio.interface';
import type { UpdateOutcome } from './types/update-outcome.type';
import { FULL_PAGE, type Page } from '../shared/types/page.interface';

@Injectable()
export class EntriesService {
  constructor(
    private readonly entriesRepository: EntriesRepository,
    private readonly daysService: DaysService,
    private readonly dataSource: DataSource,
    private readonly audioStorage: AudioStorage,
  ) {}

  find(
    userId: string,
    filters: EntryFilters = {},
    page: Page = FULL_PAGE,
  ): Promise<FiledEntry[]> {
    return this.entriesRepository.find(userId, filters, page);
  }

  count(userId: string, filters: EntryFilters = {}): Promise<number> {
    return this.entriesRepository.count(userId, filters);
  }

  create(content: string, author: DayOwner): Promise<FiledEntry> {
    return this.file(
      {
        kind: EntryKind.Text,
        content,
        audioKey: null,
        audioType: null,
        durationMs: null,
      },
      author,
    );
  }

  /*
   * The file is written first, and the row only after that has succeeded
   * (ADR-023). If the row then fails, the file is left with nothing pointing
   * at it, which harms nobody. The other order could leave a memo on the
   * page whose audio does not exist.
   *
   * The key is a new random id. Nothing the person sent, the file's name
   * included, is part of it.
   */
  async createVoiceMemo(
    audio: AudioRecording,
    durationMs: number,
    author: DayOwner,
  ): Promise<FiledEntry> {
    const audioKey = crypto.randomUUID();

    await this.audioStorage.write(audioKey, audio.bytes);

    return this.file(
      {
        kind: EntryKind.Voice,
        content: null,
        audioKey,
        audioType: audio.type,
        durationMs,
      },
      author,
    );
  }

  /*
   * Writing an entry of either kind. The server decides its time, and from
   * that its day (ADR-015).
   *
   * Creating the first entry of a day also creates the day, and the two are
   * one atomic operation. If the insert fails after the day row is written,
   * the rollback takes the day with it -- otherwise a failed write leaves an
   * empty day behind, and 00-flow.md is explicit that an empty day does not
   * exist.
   */
  private async file(
    fields: Pick<
      EntryEntity,
      'kind' | 'content' | 'audioKey' | 'audioType' | 'durationMs'
    >,
    author: DayOwner,
  ): Promise<FiledEntry> {
    const createdAt = new Date().toISOString();

    const id = await this.dataSource.transaction(async (manager) => {
      const day = await this.daysService.resolveFor(author, createdAt);

      const entry: EntryEntity = {
        id: crypto.randomUUID(),
        ...fields,
        createdAt,
        userId: author.id,
        dayId: day.id,
      };

      await manager.insert(EntryEntity, entry);

      return entry.id;
    });

    return (await this.entriesRepository.findById(id, author.id))!;
  }

  findById(id: string, userId: string): Promise<FiledEntry | undefined> {
    return this.entriesRepository.findById(id, userId);
  }

  /*
   * The update changes only a typed entry. When it changes nothing, the
   * entry is looked for, to tell a voice memo, which is refused, from an
   * entry that is not there or is not the caller's.
   */
  async update(
    id: string,
    content: string,
    userId: string,
  ): Promise<UpdateOutcome> {
    const updated = await this.entriesRepository.update(id, content, userId);

    if (updated) {
      return { status: 'updated', entry: updated };
    }

    const found = await this.entriesRepository.findById(id, userId);

    return found?.kind === EntryKind.Voice
      ? { status: 'isVoiceMemo' }
      : { status: 'notFound' };
  }

  /*
   * A voice memo's audio, for its owner only. undefined for an entry that is
   * not there, not theirs, deleted, or typed.
   */
  async readAudio(
    id: string,
    userId: string,
  ): Promise<AudioRecording | undefined> {
    const stored: StoredAudio | undefined =
      await this.entriesRepository.findAudio(id, userId);

    if (!stored) {
      return undefined;
    }

    return {
      bytes: await this.audioStorage.read(stored.audioKey),
      type: stored.audioType,
    };
  }

  /*
   * The entry's day is left alone, mood included. An emptied day is kept off
   * the calendar by the range listing and not by removing its row.
   */
  delete(id: string, userId: string): Promise<boolean> {
    return this.entriesRepository.markDeleted(
      id,
      userId,
      new Date().toISOString(),
    );
  }
}
