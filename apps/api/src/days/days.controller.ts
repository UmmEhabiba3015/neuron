import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { WireDay } from '@neuron/contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import type { Day } from './day.entity';
import { DayDateParamDto } from './day-date.dto';
import { DaysRangeQueryDto } from './days-range-query.dto';
import { DaysService } from './days.service';
import { SetMoodDto } from './set-mood.dto';

@Controller('days')
export class DaysController {
  constructor(private readonly daysService: DaysService) {}

  @Get()
  async findInRange(
    @Query() query: DaysRangeQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<WireDay[]> {
    const days = await this.daysService.findInRange(
      request.user.id,
      query.from,
      query.to,
    );

    return days.map(toResponse);
  }

  /*
   * Declared before :date, and it has to be. Routes are matched in the order
   * they are written, and "today" fits :date as well as any other string
   * does -- it would arrive at the calendar-date check and be refused as a
   * 400.
   */
  @Get('today')
  async findToday(@Req() request: AuthenticatedRequest): Promise<WireDay> {
    const { date, day } = await this.daysService.findToday(request.user);

    return day ? toResponse(day) : { date, mood: null };
  }

  /*
   * A day that has never been written to is not an error and is not a 404.
   * It is a real day with nothing on it yet, and the screen for it has to
   * render. ADR-005 settled the same question for an empty collection: an
   * empty answer is a complete answer.
   *
   * A day that has not happened yet is different. It is not an empty day,
   * it is no day at all, and it is a 404.
   */
  @Get(':date')
  async findByDate(
    @Param() params: DayDateParamDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<WireDay> {
    this.refuseADayThatHasNotHappened(params.date, request);

    const day = await this.daysService.findByDate(request.user.id, params.date);

    return day ? toResponse(day) : { date: params.date, mood: null };
  }

  /*
   * Setting a mood creates the day if it does not exist, which is the one
   * place a day is born without an entry.
   *
   * The date is checked before anything is written, so a refused request
   * leaves no day row behind.
   */
  @Put(':date/mood')
  async setMood(
    @Param() params: DayDateParamDto,
    @Body() dto: SetMoodDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<WireDay> {
    this.refuseADayThatHasNotHappened(params.date, request);

    const day = await this.daysService.setMood(
      request.user.id,
      params.date,
      dto.mood,
    );

    return day ? toResponse(day) : { date: params.date, mood: dto.mood };
  }

  /*
   * Whether a date is in the future depends on who is asking, so this takes
   * the request and not only the date. The message has the same form as the
   * one for an entry that is not there.
   */
  private refuseADayThatHasNotHappened(
    date: string,
    request: AuthenticatedRequest,
  ): void {
    if (!this.daysService.hasHappened(request.user, date)) {
      throw new NotFoundException(`Day with date ${date} not found`);
    }
  }
}

/*
 * A day as it travels is the contract's WireDay. The entity also carries
 * user_id, which is select:false and never leaves the server, so the answer
 * is built field by field rather than being whatever the entity holds.
 */
function toResponse(day: Day): WireDay {
  return { date: day.date, mood: day.mood };
}
