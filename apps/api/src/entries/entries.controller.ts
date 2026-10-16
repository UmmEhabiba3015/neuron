import {
  BadRequestException,
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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { CreateVoiceMemoDto } from './dto/create-voice-memo.dto';
import { VoiceMemoSizeInterceptor } from './interceptors/voice-memo-size.interceptor';
import type { UploadedAudio } from './types/uploaded-audio.interface';
import {
  AUDIO_FIELD,
  RECORDING_MISSING,
  VOICE_MEMO_UPLOAD,
} from './voice-memo-rules';

/* Said when PATCH /entries/:id is asked to change a voice memo. */
export const VOICE_MEMO_NOT_EDITABLE = 'A voice memo cannot be edited';

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

  /*
   * A voice memo: one multipart form, holding the recording as the file
   * "audio" and its length as durationMs. The rules are in
   * voice-memo-rules.ts; the size is checked first, then the type, as the
   * file arrives, then the length, once the form has been read.
   */
  @Post('voice')
  @UseInterceptors(
    VoiceMemoSizeInterceptor,
    FileInterceptor(AUDIO_FIELD, VOICE_MEMO_UPLOAD),
  )
  async createVoiceMemo(
    @UploadedFile() audio: UploadedAudio | undefined,
    @Body() dto: CreateVoiceMemoDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<EntryResponseDto> {
    if (!audio || audio.size === 0) {
      throw new BadRequestException(RECORDING_MISSING);
    }

    return new EntryResponseDto(
      await this.entriesService.createVoiceMemo(
        { bytes: audio.buffer, type: audio.mimetype },
        dto.durationMs,
        request.user,
      ),
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

  /*
   * The bytes of a voice memo, with the type it was recorded in. Another
   * person's memo, a deleted one and a typed entry are all the same 404.
   * This is the only way audio leaves the API (ADR-023).
   */
  @Get(':id/audio')
  async findAudio(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const audio = await this.entriesService.readAudio(id, request.user.id);

    if (!audio) {
      throw new NotFoundException(`Voice memo with ID ${id} not found`);
    }

    return new StreamableFile(audio.bytes, {
      type: audio.type,
      length: audio.bytes.length,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<EntryResponseDto> {
    const outcome = await this.entriesService.update(
      id,
      dto.content,
      request.user.id,
    );

    if (outcome.status === 'isVoiceMemo') {
      throw new BadRequestException(VOICE_MEMO_NOT_EDITABLE);
    }

    if (outcome.status === 'notFound') {
      throw new NotFoundException(`Entry with ID ${id} not found`);
    }

    return new EntryResponseDto(outcome.entry);
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
