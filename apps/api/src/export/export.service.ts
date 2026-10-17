import { Injectable, Logger } from '@nestjs/common';
import { EntryKind } from '@neuron/contracts';
import { strToU8, zipSync, type Zippable } from 'fflate';
import { dayFor } from '../days/day-boundary';
import { AudioStorage } from '../entries/audio-storage';
import type { UserEntity } from '../users/entities/user.entity';
import { JournalExportDto } from './dto/journal-export.dto';
import { ExportRepository } from './export.repository';
import { drawJournalPdf } from './journal-pdf';
import type { ExportFile } from './types/export-file.interface';

/*
 * The export (docs/features.md, Ref 36; ADR-025): one ZIP, made in memory,
 * holding journal.pdf, journal.json, and audio/<entry id>.<webm|mp4> for
 * each voice memo, its file as it was recorded.
 */
@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly exportRepository: ExportRepository,
    private readonly audioStorage: AudioStorage,
  ) {}

  async build(user: UserEntity, now: Date = new Date()): Promise<ExportFile> {
    const rows = await this.exportRepository.liveEntriesOf(user.id);
    const journal = new JournalExportDto(user, rows, now.toISOString());

    /* A PDF and a recording are compressed already; zipping them again only costs time. */
    const files: Zippable = {
      'journal.pdf': [await drawJournalPdf(journal), { level: 0 }],
      'journal.json': strToU8(JSON.stringify(journal, null, 2)),
    };

    for (const row of rows) {
      if (row.kind !== EntryKind.Voice || !row.audioKey || !row.audioType) {
        continue;
      }

      /*
       * A memo whose file cannot be read is still in the PDF and the JSON,
       * and the rest of the export goes on without its audio.
       */
      try {
        files[`audio/${row.id}.${extensionOf(row.audioType)}`] = [
          await this.audioStorage.read(row.audioKey),
          { level: 0 },
        ];
      } catch (error: unknown) {
        this.logger.warn(
          `The export left out the audio of memo ${row.id}, which could not be read: ${String(error)}`,
        );
      }
    }

    return {
      /* Today in the person's timezone, never the browser's clock (ADR-015). */
      filename: `neuron-export-${dayFor(now, user.timezone)}.zip`,
      bytes: Buffer.from(zipSync(files)),
    };
  }
}

/*
 * The type as stored is the type part of what the browser recorded, such as
 * audio/webm (ADR-023), and its subtype is the file's extension: webm or mp4.
 */
export function extensionOf(audioType: string): string {
  return audioType.split(';')[0].split('/')[1].trim().toLowerCase();
}
