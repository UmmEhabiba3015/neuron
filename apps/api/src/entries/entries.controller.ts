import {
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
import { CreateEntryDto } from './create-entry.dto';
import { FindEntriesQueryDto } from './find-entries-query.dto';
import { UpdateEntryDto } from './update-entry.dto';
// A plain import, not `import type`, and the difference is load-bearing. These
// three are classes now, and `emitDecoratorMetadata` writes each parameter's
// declared type into the compiled file as a *runtime* value — which is how the
// global pipe learns which rules to apply. `import type` would tell TypeScript
// to erase the import, and the pipe would receive `Object` and validate
// nothing.
//
// `JournalEntry` stays type-only for a different reason. It stopped being an
// interface on Day 8 and is a decorated TypeORM entity now, so there *is* a
// runtime value to point at — but nothing here needs one. It appears only in
// return types, and `import type` is what keeps the guarantee that this file
// makes no decisions about storage: an erased import cannot be constructed,
// queried, or handed to a repository (ADR-010).
import type { JournalEntry } from './entry.interface';

// A "controller" in Nest only handles HTTP: which route maps to which
// method, and what gets returned. It deliberately knows nothing about
// where the data comes from — that's the service's job (see
// entries.service.ts). This split means the HTTP layer and the data layer
// can change independently: swapping the hardcoded array for a database
// later won't require touching this file at all.
//
// Until Day 7 it also held 91 lines of hand-written parsing. Those rules have
// not been deleted, they have moved: onto the three DTO classes this file
// imports, enforced by the `ValidationPipe` registered in `app.module.ts`
// before any method below is entered. The change that matters is not that the
// code is shorter — it is that nothing has to remember to call it. A new
// endpoint added below is validated whether its author thought about validation
// or not (ADR-008).
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  // `Promise<...>` on every handler below, and nothing observable changed with
  // it. TypeORM has no synchronous API, so `await` travelled up from the
  // repository through the service to here; Nest awaits whatever a handler
  // returns before serializing it, so the status codes and bodies are the ones
  // that were there yesterday (ADR-010).
  @Get()
  findAll(@Query() query: FindEntriesQueryDto): Promise<JournalEntry[]> {
    // `!== undefined`, never `if (query.word)`. An absent `word` and an empty
    // one are two different messages, and truthiness cannot tell them apart:
    // `""` is falsy, so the old `if (term)` treated `?word=` as "no search was
    // requested" and returned the entire journal. `GET /entries` means "I am
    // not searching, show me everything"; `GET /entries?word=` means "I am
    // searching, and this is my term" — and searching for nothing finds nothing
    // (ADR-008, Decision 7).
    if (query.word !== undefined) {
      return this.entriesService.findByContent(query.word);
    }

    return this.entriesService.findAll();
  }

  // Returns the created entry rather than an empty body: the server generates
  // `id` and `createdAt`, so a client that only got a 201 would have no way to
  // learn either without immediately re-fetching the whole list.
  //
  // The parameter is a `CreateEntryDto` and was `unknown` until Day 7. That
  // reversal is the whole shape of this task. `unknown` was the honest type
  // while nothing ran before this method, because a request body is whatever
  // arrived over the network and naming it a DTO asserted a guarantee nobody
  // had established. A pipe in front is exactly what establishes it — so the
  // label stops being a lie. `unknown` and `ValidationPipe` cannot both be
  // correct at once, and which one is depends entirely on whether anything
  // validates in between (ADR-008).
  @Post()
  create(@Body() dto: CreateEntryDto): Promise<JournalEntry> {
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
  async countEntries(): Promise<{ count: number }> {
    return { count: await this.entriesService.countEntries() };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<JournalEntry> {
    const entry = await this.entriesService.findById(id);

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
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
  ): Promise<JournalEntry> {
    // The one assertion left in this file, and it is worth reading twice.
    // `content` is optional on `UpdateEntryDto` because `PATCH` is a partial
    // update, and `@ContainsAtLeastOneField` is what makes an empty body a 400
    // before this line runs. With exactly one updatable field, "at least one
    // field arrived" and "`content` arrived" are the same sentence — so the
    // value is always present here, and the compiler has no way to know it.
    //
    // That stops being true the day a second field is added (mood, Day 13):
    // `{ "mood": "tired" }` would then satisfy the class rule with `content`
    // still undefined, and nothing here would complain. The old
    // `parseUpdateEntryDto` returned a narrowed type and gave the compiler that
    // guarantee for free; this is what the refactor cost, written down where
    // whoever adds the second field will read it.
    const updated = await this.entriesService.update(id, dto.content!);

    // Validation runs before the lookup, so a malformed body against a missing
    // id answers 400 rather than 404. That is deliberate, and it is now the
    // pipe's doing rather than an ordering choice in this method: the request
    // could not be understood, so the server never got as far as asking whether
    // the entry exists.
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
  async delete(@Param('id') id: string): Promise<JournalEntry> {
    const deleted = await this.entriesService.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return deleted;
  }
}
