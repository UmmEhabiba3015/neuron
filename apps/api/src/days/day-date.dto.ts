import { IsCalendarDate } from './is-calendar-date.decorator';

export class DayDateParamDto {
  @IsCalendarDate()
  date!: string;
}
