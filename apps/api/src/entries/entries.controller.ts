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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './create-entry.dto';
import { FindEntriesQueryDto } from './find-entries-query.dto';
import { UpdateEntryDto } from './update-entry.dto';

import type { JournalEntry } from './entry.entity';

@UseGuards(JwtAuthGuard)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  findAll(@Query() query: FindEntriesQueryDto): Promise<JournalEntry[]> {
    if (query.word !== undefined) {
      return this.entriesService.findByContent(query.word);
    }

    return this.entriesService.findAll();
  }

  @Post()
  create(
    @Body() dto: CreateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<JournalEntry> {
    return this.entriesService.create(dto.content, request.user.id);
  }

  @Get('count')
  async countEntries(): Promise<{ count: number }> {
    return { count: await this.entriesService.countEntries() };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<JournalEntry> {
    const entry = await this.entriesService.findById(id);

    if (!entry) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return entry;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
  ): Promise<JournalEntry> {
    const updated = await this.entriesService.update(id, dto.content!);

    if (!updated) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return updated;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<JournalEntry> {
    const deleted = await this.entriesService.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return deleted;
  }
}
