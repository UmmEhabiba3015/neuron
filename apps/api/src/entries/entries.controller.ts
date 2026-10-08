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
import type { FiledEntry } from './entry.entity';
import { FindEntriesQueryDto } from './find-entries-query.dto';
import { UpdateEntryDto } from './update-entry.dto';

/*
 * Every handler here answers with the contract's WireEntry, built field by
 * field in toResponse at the foot of this file. If the contract gains a
 * field that toResponse does not fill, this file stops compiling.
 */
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  async findAll(
    @Query() query: FindEntriesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<WireEntry[]> {
    const entries = await this.entriesService.find(
      request.user.id,
      filtersFrom(query),
      {
        limit: query.limit ?? DEFAULT_PAGE_SIZE,
        offset: query.offset ?? 0,
      },
    );

    return entries.map(toResponse);
  }

  @Post()
  async create(
    @Body() dto: CreateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<WireEntry> {
    return toResponse(
      await this.entriesService.create(dto.content, request.user),
    );
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

    return toResponse(entry);
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

    return toResponse(updated);
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

/*
 * An entry as it travels is the contract's WireEntry. The answer is built
 * field by field, so it holds these four things and nothing else the entity
 * or its day may be carrying. The compiler would not notice an extra field.
 *
 * date is the date of the day row the entry points at.
 */
function toResponse(entry: FiledEntry): WireEntry {
  return {
    id: entry.id,
    content: entry.content,
    createdAt: entry.createdAt,
    date: entry.day.date,
  };
}
