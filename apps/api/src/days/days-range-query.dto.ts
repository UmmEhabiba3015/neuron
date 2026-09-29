import { IsCalendarDate } from './is-calendar-date.decorator';

export class DaysRangeQueryDto {
  @IsCalendarDate()
  from!: string;

  @IsCalendarDate()
  to!: string;
}
