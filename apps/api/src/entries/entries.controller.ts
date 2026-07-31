import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import type { CreateEntryDto } from './create-entry.dto';
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
  findAll(@Query('word') word?: string): JournalEntry[] {
    if (word) {
      return this.entriesService.findByContent(word);
    }
    return this.entriesService.findAll();
  }
  // Returns the created entry rather than an empty body: the server generates
  // `id` and `createdAt`, so a client that only got a 201 would have no way to
  // learn either without immediately re-fetching the whole list.
  //
  // The parameter is typed `unknown`, not `CreateEntryDto`, and the difference
  // matters. A request body is whatever arrived over the network; calling it a
  // `CreateEntryDto` before anything has checked it would assert a guarantee no
  // one has established — the same false claim the old inline type made.
  // `unknown` is the honest type for un-inspected input, and it forces the
  // check below to happen before the value can be used at all.
  @Post()
  create(@Body() body: unknown): JournalEntry {
    const dto = parseCreateEntryDto(body);

    // Unwrapping happens here, at the HTTP boundary, so the service keeps
    // receiving a plain string.
    return this.entriesService.create(dto.content);
  }

  // Returns `{ count }` rather than a bare `5`. Two reasons, and the second is
  // the one that will matter later: every other endpoint here returns an object
  // or an array of objects, so a naked number is the lone exception; and an
  // object can grow a field without breaking clients that already read `count`,
  // whereas a bare number has nowhere to put one (ADR-005).
  //
  // The wrapper is built here and not in the service, because "how many entries
  // exist" is a number in application terms. The object is a fact about this
  // API's response shape, which makes it an HTTP concern.
  @Get('count')
  countEntries(): { count: number } {
    return { count: this.entriesService.countEntries() };
  }

  @Get(':id')
  findById(@Param('id') id: string): JournalEntry {
    const entry = this.entriesService.findById(id);

    // This is the translation step the layers below refuse to do: the service
    // reports absence as `undefined`, in storage-and-application vocabulary,
    // and only here does that become the number 404 (ADR-005).
    if (!entry) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    // Narrowed to JournalEntry by the guard above, so the declared return type
    // is now something the compiler verified rather than something asserted.
    return entry;
  }
}

// Hand-written rather than delegated to `class-validator` or `zod`. One
// endpoint with one required field does not yet justify a dependency or a new
// concept; the condition for revisiting that is recorded in ADR-005.
//
// Each of the three checks below rejects a body that would otherwise reach the
// database, and none is implied by another.
function parseCreateEntryDto(body: unknown): CreateEntryDto {
  // Guards against `null` too, which `typeof` alone would not: `typeof null`
  // is `'object'`, so a bare null body would reach the property access below.
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Request body must be an object');
  }

  const { content } = body as { content?: unknown };

  if (content === undefined) {
    throw new BadRequestException('content is required');
  }

  // Not redundant with the string check that would happen anyway, because
  // SQLite would not do one. A `TEXT` column has type *affinity*, not a type
  // constraint: handed the number 42 it silently stores the string "42". The
  // POST response would echo `"content": 42` from the in-memory object while
  // every later GET returned `"content": "42"` from the row — one entry with
  // two types depending on which endpoint served it.
  if (typeof content !== 'string') {
    throw new BadRequestException('content must be a string');
  }

  // `.trim()` is used to *decide*, not to modify. An entry whose text is empty
  // or entirely whitespace can never be read, searched, or summarised, so it is
  // rejected — but what gets stored below is the original string, because
  // trimming it would silently rewrite what the user wrote.
  if (content.trim().length === 0) {
    throw new BadRequestException('content must not be empty');
  }

  return { content };
}
