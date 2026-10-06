import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min, ValidateIf } from 'class-validator';

import { IsCalendarDate } from '../days/is-calendar-date.decorator';

import { MAX_PAGE_SIZE } from './page';

export class FindEntriesQueryDto {
  @ValidateIf((query: FindEntriesQueryDto) => query.word !== undefined)
  @IsString()
  word?: string;

  /*
   * Present and empty is refused rather than treated as absent: ?date= is a
   * request for the entries of no particular day, and answering it with the
   * whole journal is the silently ignored filter ADR-017 exists to prevent.
   */
  @ValidateIf((query: FindEntriesQueryDto) => query.date !== undefined)
  @IsCalendarDate()
  date?: string;

  /*
   * Query parameters arrive as strings, and transform:true on the global
   * pipe is not enough on its own: it builds the DTO instance but leaves
   * "5" a string unless something says what to convert it to. Type does.
   *
   * The alternative is enableImplicitConversion on the pipe, which would
   * coerce every input in the application from its declared type. That is a
   * much larger decision than paging, so the conversion is declared here,
   * on the two fields that need it.
   */
  @ValidateIf((query: FindEntriesQueryDto) => query.limit !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  @ValidateIf((query: FindEntriesQueryDto) => query.offset !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
