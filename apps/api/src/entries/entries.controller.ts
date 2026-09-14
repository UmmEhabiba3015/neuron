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
import { FindEntriesQueryDto } from './find-entries-query.dto';
import { UpdateEntryDto } from './update-entry.dto';

import type { JournalEntry } from './entry.entity';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  findAll(
    @Query() query: FindEntriesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry[]> {
    if (query.word !== undefined) {
      return this.entriesService.findByContent(query.word, request.user.id);
    }

    return this.entriesService.findAll(request.user.id);
  }

  @Post()
  create(
    @Body() dto: CreateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry> {
    return this.entriesService.create(dto.content, request.user.id);
  }

  @Get('count')
  async countEntries(
    @Req() request: AuthenticatedRequest,
  ): Promise<{ count: number }> {
    return { count: await this.entriesService.countEntries(request.user.id) };
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
