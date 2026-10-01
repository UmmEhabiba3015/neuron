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
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './create-entry.dto';
import { CountEntriesQueryDto } from './count-entries-query.dto';
import type { EntryFilters } from './entry-filters';
import { FindEntriesQueryDto } from './find-entries-query.dto';
import { DEFAULT_PAGE_SIZE } from './page';
import { UpdateEntryDto } from './update-entry.dto';

import type { JournalEntry } from './entry.entity';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  /*
   * A page, not the whole journal. Returning every entry ever written is
   * fine at twelve and wrong at twelve hundred, and the designs show month
   * six as the ordinary case rather than the extreme one.
   *
   * The default is a page rather than everything, so a client that has not
   * been updated gets a fast, correct first page instead of a slow, complete
   * one. That is the failure worth choosing.
   */
  @Get()
  findAll(
    @Query() query: FindEntriesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry[]> {
    return this.entriesService.find(request.user.id, filtersFrom(query), {
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
      offset: query.offset ?? 0,
    });
  }

  @Post()
  create(
    @Body() dto: CreateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry> {
    return this.entriesService.create(dto.content, request.user.id);
  }

  /*
   * Counting takes the same filters as listing, so "how many match this
   * search" has an answer. It did not: count ignored the word entirely and
   * returned the size of the whole journal, which is a number no screen
   * wanted.
   *
   * A separate resource rather than an envelope around the list. ADR-005
   * settled that a collection is a bare array, and a total for one screen is
   * not a reason to reopen it -- ADR-017.
   */
  @Get('count')
  async countEntries(
    @Query() query: CountEntriesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    return {
      count: await this.entriesService.count(
        request.user.id,
        filtersFrom(query),
      ),
    };
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry> {
    const entry = await this.entriesService.findById(id, request.user.id);

    if (!entry) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return entry;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry> {
    const updated = await this.entriesService.update(
      id,
      dto.content!,
      request.user.id,
    );

    if (!updated) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return updated;
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry> {
    const deleted = await this.entriesService.delete(id, request.user.id);

    if (!deleted) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return deleted;
  }
}

/*
 * The listing and the count build their filters the same way, so a filter
 * cannot reach one and miss the other.
 */
function filtersFrom(query: { word?: string }): EntryFilters {
  return { word: query.word };
}
