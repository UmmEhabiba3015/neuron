import { IsCalendarDate } from '../../shared/decorators/is-calendar-date.decorator';

export class DayDateParamDto {
  @IsCalendarDate()
  date!: string;
}
