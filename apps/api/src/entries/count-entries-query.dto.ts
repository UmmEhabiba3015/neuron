import { IsString, ValidateIf } from 'class-validator';
import { IsCalendarDate } from '../days/is-calendar-date.decorator';

export class CountEntriesQueryDto {
  @ValidateIf((query: CountEntriesQueryDto) => query.word !== undefined)
  @IsString()
  word?: string;

  @ValidateIf((query: CountEntriesQueryDto) => query.date !== undefined)
  @IsCalendarDate()
  date?: string;
}
