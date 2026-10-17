import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, type EntityManager } from 'typeorm';
import { EntryEntity } from './entities/entry.entity';

/*
 * The only reads in the application that see deleted entries (ADR-020 keeps
 * them out of every other). Both are about files, and a soft-deleted memo
 * still has its file, kept until the account is deleted:
 *
 *   - the sweep at start must keep that file, so it must see the row;
 *   - deleting the account must remove that file, so it must see the row.
 *
 * Neither answers with an entry. Each answers with audio keys only, which
 * never leave the API. src/entries/no-deleted-rows-asked-for.spec.ts allows
 * withDeleted in this file and in no other.
 */
@Injectable()
export class AudioKeysRepository {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly entries: Repository<EntryEntity>,
  ) {}

  /* Every key any entry holds: anyone's, deleted rows included. */
  async all(): Promise<Set<string>> {
    const rows = await this.entries.find({
      select: { id: true, audioKey: true },
      where: { audioKey: Not(IsNull()) },
      withDeleted: true,
    });

    return new Set(rows.map((row) => row.audioKey!));
  }

  /*
   * The keys of one person's memos, deleted ones included. The manager is the
   * transaction's when the account is being deleted, so the keys are read in
   * the same transaction that removes the rows.
   */
  async ofUser(
    userId: string,
    manager: EntityManager = this.entries.manager,
  ): Promise<string[]> {
    const rows = await manager.find(EntryEntity, {
      select: { id: true, audioKey: true },
      where: { userId, audioKey: Not(IsNull()) },
      withDeleted: true,
    });

    return rows.map((row) => row.audioKey!);
  }
}
