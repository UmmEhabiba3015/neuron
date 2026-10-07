import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { DEFAULT_PAGE_SIZE, type WireEntry } from '@neuron/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './create-entry.dto';
import { CountEntriesQueryDto } from './count-entries-query.dto';
import type { EntryFilters } from './entry-filters';
import { FindEntriesQueryDto } from './find-entries-query.dto';
import { UpdateEntryDto } from './update-entry.dto';

/*
 * Every handler here answers with the contract's WireEntry, and hands back
 * the JournalEntry entity the service gave it. That assignment is the check:
 * if the entity stops having what the contract promises, this file stops
 * compiling.
 */
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  findAll(
    @Query() query: FindEntriesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<WireEntry[]> {
    return this.entriesService.find(request.user.id, filtersFrom(query), {
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
      offset: query.offset ?? 0,
    });
  }

  @Post()
  create(
    @Body() dto: CreateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<WireEntry> {
    return this.entriesService.create(dto.content, request.user.id);
  }

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
  ): Promise<WireEntry> {
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
  ): Promise<WireEntry> {
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    const deleted = await this.entriesService.delete(id, request.user.id);

    if (!deleted) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }
  }
}

/*
 * The listing and the count build their filters the same way, so a filter
 * cannot reach one and miss the other.
 */
function filtersFrom(query: { word?: string; date?: string }): EntryFilters {
  return { word: query.word, date: query.date };
}
