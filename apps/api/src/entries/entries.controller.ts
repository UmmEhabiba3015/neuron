import { Controller, Get } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.interface';

// A "controller" in Nest only handles HTTP: which route maps to which
// method, and what gets returned. It deliberately knows nothing about
// where the data comes from — that's the service's job (see
// entries.service.ts). This split means the HTTP layer and the data layer
// can change independently: swapping the hardcoded array for a database
// later won't require touching this file at all.
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  findAll(): JournalEntry[] {
    return this.entriesService.findAll();
  }
}
