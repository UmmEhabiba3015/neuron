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
// Deliberately not `import type`: `emitDecoratorMetadata` writes each
// parameter's declared type into the compiled file as a runtime value, which is
// how the global pipe learns which rules to apply. Erasing these imports would
// hand the pipe `Object` and validate nothing.
import type { JournalEntry } from './entry.entity';

// HTTP only: routes, status codes, and response shapes. It knows nothing about
// where data comes from (ADR-005).
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  findAll(@Query() query: FindEntriesQueryDto): Promise<JournalEntry[]> {
    // `!== undefined`, never `if (query.word)`. `""` is falsy, so truthiness
    // would treat `?word=` as "no search requested" and return the entire
    // journal (ADR-008).
    if (query.word !== undefined) {
      return this.entriesService.findByContent(query.word);
    }

    return this.entriesService.findAll();
  }

  // Returns the created entry: the server generates `id` and `createdAt`, so a
  // bare 201 would leave the client unable to learn either.
  @Post()
  create(@Body() dto: CreateEntryDto): Promise<JournalEntry> {
    return this.entriesService.create(dto.content);
  }

  // `{ count }` rather than a bare number, which has nowhere to grow a second
  // field without breaking clients (ADR-005).
  @Get('count')
  async countEntries(): Promise<{ count: number }> {
    return { count: await this.entriesService.countEntries() };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<JournalEntry> {
    const entry = await this.entriesService.findById(id);

    // The translation the layers below refuse to make: `undefined` becomes 404
    // here and nowhere else (ADR-005).
    if (!entry) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return entry;
  }

  // `PATCH`, not `PUT`: `PUT` would oblige the client to send `id` and
  // `createdAt`, which it is not permitted to set (ADR-006).
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
  ): Promise<JournalEntry> {
    // The `!` is safe only while `content` is the single updatable field, so
    // "at least one field arrived" and "content arrived" are one sentence. Adding
    // mood (Day 13) breaks that: `{"mood":"tired"}` would satisfy the class rule
    // with `content` undefined and nothing here would complain.
    const updated = await this.entriesService.update(id, dto.content!);

    if (!updated) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return updated;
  }

  // `200` with the deleted entry rather than `204`, so a client can offer an
  // undo without having fetched it first (ADR-006).
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<JournalEntry> {
    const deleted = await this.entriesService.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return deleted;
  }
}
