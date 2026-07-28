import { Injectable } from '@nestjs/common';
import { JournalEntry } from './entry.interface';

// Nest calls a class like this a "service" (or "provider"). Its job is to
// own data and business logic — today that's just a hardcoded array, but
// on Day 3 this same method will read from a real database instead. The
// controller below won't need to change at all when that happens, because
// it never touches the data directly; it only asks this service for it.
@Injectable()
export class EntriesService {
  private readonly entries: JournalEntry[] = [
    {
      id: '1',
      content:
        'Started building Neuron today. The repo is finally wired up as a real workspace.',
      createdAt: '2026-07-28T09:00:00.000Z',
    },
    {
      id: '2',
      content:
        'First endpoint is live: GET /entries. Small win, but it proves the whole chain works.',
      createdAt: '2026-07-28T10:30:00.000Z',
    },
  ];

  findAll(): JournalEntry[] {
    return this.entries;
  }
}
