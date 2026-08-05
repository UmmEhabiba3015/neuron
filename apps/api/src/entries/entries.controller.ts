import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import type { CreateEntryDto } from './create-entry.dto';
import type { UpdateEntryDto } from './update-entry.dto';
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

  // The parameter is typed `unknown` for the same reason `@Body` is. A URL may
  // legally repeat a query parameter, and when it does Express hands over an
  // **array** — so `word?: string` was a claim about the network that nothing
  // had established, and the compiler believed it completely. `%${word}%` then
  // produced `%a,b%` and the search returned `200 []`, which tells the user
  // "I searched and found nothing" when the truth is "I could not understand
  // your request" (ADR-006).
  @Get()
  findAll(@Query('word') word?: unknown): JournalEntry[] {
    const term = parseSearchTerm(word);

    if (term) {
      return this.entriesService.findByContent(term);
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

  // `PATCH`, not `PUT`. `PUT` means "replace the resource with this
  // representation", which would oblige the client to send `id` and
  // `createdAt` — two values it is not permitted to set. `PATCH` means "apply
  // these changes", which is what is actually happening (ADR-006).
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown): JournalEntry {
    const dto = parseUpdateEntryDto(body);

    const updated = this.entriesService.update(id, dto.content);

    // Validation runs before the lookup, so a malformed body against a missing
    // id answers 400 rather than 404. That is deliberate: the request could not
    // be understood, so the server never got as far as asking whether the
    // entry exists.
    if (!updated) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return updated;
  }

  // `200` with the deleted entry, not `204 No Content`. `204` is the more
  // common answer and was rejected on purpose: the deleted entry lets a client
  // show "deleted: your text", or offer an undo, without having fetched it
  // first. Returning information the caller can ignore is a cheaper mistake
  // than withholding information it needs (ADR-006).
  @Delete(':id')
  delete(@Param('id') id: string): JournalEntry {
    const deleted = this.entriesService.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return deleted;
  }
}

// Everything below is hand-written rather than delegated to `class-validator`
// or `zod`. Two endpoints sharing one rule does not yet justify a dependency;
// the four conditions that would are recorded in ADR-006.
//
// The rules are written once each and called from both endpoints. That
// arrangement is what ADR-006 leaned on when it deferred a validation library,
// so it is worth stating where each rule lives:
//
//   parseEntryBody     the body is an object, and every field in it is one the
//                      server recognises
//   parseContent       the three rules about what a content value may be
//
// `parseCreateEntryDto` and `parseUpdateEntryDto` below add nothing except the
// one question the two endpoints genuinely answer differently: what it means
// for `content` to be absent.

// The only fields a client may send. Any other key is a 400 that names the
// offending field, because the failure this prevents is a typo — `PATCH
// {"contnet": "I fixed it"}` used to return 200 and change nothing, and the
// user had no way to discover that their edit was thrown away (ADR-006).
const RECOGNISED_FIELDS = ['content'];

function parseEntryBody(body: unknown): Record<string, unknown> {
  // Guards against `null` too, which `typeof` alone would not: `typeof null`
  // is `'object'`, so a bare null body would reach the property access below.
  // An array is rejected here rather than falling through to the field check,
  // where its indices would be reported as unrecognised field names.
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('Request body must be an object');
  }

  const fields = body as Record<string, unknown>;

  const unrecognised = Object.keys(fields).filter(
    (field) => !RECOGNISED_FIELDS.includes(field),
  );

  // The message names the fields. "Invalid body" would be true and useless;
  // the whole point of this check is that someone who misspells a field name
  // finds out which one.
  if (unrecognised.length > 0) {
    throw new BadRequestException(
      `Unrecognised field(s): ${unrecognised.join(', ')}. Only ${RECOGNISED_FIELDS.join(', ')} may be sent.`,
    );
  }

  return fields;
}

// The three checks on a content value, in one place because `POST` and `PATCH`
// apply exactly the same three. None is implied by another.
function parseContent(content: unknown): string {
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
  // rejected — but what gets returned below is the original string, because
  // trimming it would silently rewrite what the user wrote.
  if (content.trim().length === 0) {
    throw new BadRequestException('content must not be empty');
  }

  return content;
}

function parseCreateEntryDto(body: unknown): CreateEntryDto {
  const fields = parseEntryBody(body);

  if (fields.content === undefined) {
    throw new BadRequestException('content is required');
  }

  return { content: parseContent(fields.content) };
}

function parseUpdateEntryDto(body: unknown): UpdateEntryDto {
  const fields = parseEntryBody(body);

  // The one line that differs from `parseCreateEntryDto`, and only in what it
  // means. On `POST`, an absent `content` is a missing required field. On
  // `PATCH` it means the request asks for no change at all, which is a body
  // the server cannot act on. The two messages describe two different
  // mistakes, so they are worth keeping distinct.
  if (fields.content === undefined) {
    throw new BadRequestException(
      'Request body must contain at least one field to update',
    );
  }

  return { content: parseContent(fields.content) };
}

// `undefined` when no search term was given, so the caller lists everything.
// A non-string is a 400 rather than a guess: taking `word[0]` would pick one of
// two terms the user asked for and silently discard the other (ADR-006).
function parseSearchTerm(word: unknown): string | undefined {
  if (word === undefined) {
    return undefined;
  }

  if (typeof word !== 'string') {
    throw new BadRequestException('word may only be given once');
  }

  return word;
}
