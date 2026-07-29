import { Body, Controller, Get, Post } from '@nestjs/common';
import { EntriesService } from './entries.service';
// `import type` rather than a plain import: `emitDecoratorMetadata` makes the
// compiler emit a *runtime* reference for a decorated method's return type, and
// an interface has no runtime value to point at. Marking the import as
// type-only tells TypeScript not to try.
import type { JournalEntry } from './entry.interface';

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
  // Returns the created entry rather than an empty body: the server generates
  // `id` and `createdAt`, so a client that only got a 201 would have no way to
  // learn either without immediately re-fetching the whole list.
  //
  // `body` is typed inline and trusted completely. Post `{}` and this will
  // fail — deliberately. DTOs and validation are Day 4, and that failure is
  // the evidence Day 4 gets built on.
  @Post()
  create(@Body() body: { content: string }): JournalEntry {
    // Unwrapping happens here, at the HTTP boundary, so the service keeps
    // receiving a plain string.
    return this.entriesService.create(body.content);
  }
}
