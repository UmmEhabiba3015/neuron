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
import { DEFAULT_PAGE_SIZE } from '@neuron/contracts';
import type { AuthenticatedRequest } from '../shared/types/authenticated-request.interface';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { EntryResponseDto } from './dto/entry-response.dto';
import { CountEntriesQueryDto } from './dto/count-entries-query.dto';
import { CountResponseDto } from './dto/count-response.dto';
import type { EntryFilters } from './types/entry-filters.interface';
import { FindEntriesQueryDto } from './dto/find-entries-query.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

/*
 * Every entry handler here answers with EntryResponseDto, which implements
 * the contract's Entry, and the count with CountResponseDto. If the contract
 * gains a field that EntryResponseDto does not fill, it stops compiling.
 */
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  async findAll(
    @Query() query: FindEntriesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<EntryResponseDto[]> {
    const entries = await this.entriesService.find(
      request.user.id,
      filtersFrom(query),
      {
        limit: query.limit ?? DEFAULT_PAGE_SIZE,
        offset: query.offset ?? 0,
      },
    );

    return entries.map((entry) => new EntryResponseDto(entry));
  }

  @Post()
  async create(
    @Body() dto: CreateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<EntryResponseDto> {
    return new EntryResponseDto(
      await this.entriesService.create(dto.content, request.user),
    );
  }

  @Get('count')
  async countEntries(
    @Query() query: CountEntriesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CountResponseDto> {
    return new CountResponseDto(
      await this.entriesService.count(request.user.id, filtersFrom(query)),
    );
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<EntryResponseDto> {
    const entry = await this.entriesService.findById(id, request.user.id);

    if (!entry) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return new EntryResponseDto(entry);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<EntryResponseDto> {
    const updated = await this.entriesService.update(
      id,
      dto.content!,
      request.user.id,
    );

    if (!updated) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return new EntryResponseDto(updated);
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
