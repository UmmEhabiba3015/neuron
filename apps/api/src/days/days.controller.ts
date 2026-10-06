import { Body, Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import type { Day } from './day.entity';
import { DayDateParamDto } from './day-date.dto';
import { DaysRangeQueryDto } from './days-range-query.dto';
import { DaysService } from './days.service';
import { SetMoodDto } from './set-mood.dto';

/*
 * What a day looks like on the wire. The entity carries user_id, which is
 * select:false and never leaves the server, so the response shape is stated
 * here rather than being whatever the entity happens to hold.
 */
export interface DayResponse {
  date: string;
  mood: string | null;
}

@Controller('days')
export class DaysController {
  constructor(private readonly daysService: DaysService) {}

  /*
   * The calendar zoom paints which dates have content. It needs the dates,
   * not the writing on them: returning the days themselves would send a
   * month of prose to draw a grid of squares.
   */
  @Get()
  async findInRange(
    @Query() query: DaysRangeQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DayResponse[]> {
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
  async findToday(@Req() request: AuthenticatedRequest): Promise<DayResponse> {
    const { date, day } = await this.daysService.findToday(request.user.id);

    return day ? toResponse(day) : { date, mood: null };
  }

  /*
   * A day that has never been written to is not an error and is not a 404.
   * It is a real day with nothing on it yet, and the screen for it has to
   * render. ADR-005 settled the same question for an empty collection: an
   * empty answer is a complete answer.
   */
  @Get(':date')
  async findByDate(
    @Param() params: DayDateParamDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DayResponse> {
    const day = await this.daysService.findByDate(request.user.id, params.date);

    return day ? toResponse(day) : { date: params.date, mood: null };
  }

  /*
   * PUT rather than PATCH: mood is one field with one value, and setting it
   * twice has the same result as setting it once.
   *
   * Setting a mood creates the day if it does not exist, which is the one
   * place a day is born without an entry. "An empty day does not exist"
   * governs what is rendered and what a deleted last entry leaves behind;
   * a day someone has deliberately marked is not empty.
   */
  @Put(':date/mood')
  async setMood(
    @Param() params: DayDateParamDto,
    @Body() dto: SetMoodDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DayResponse> {
    const day = await this.daysService.setMood(
      request.user.id,
      params.date,
      dto.mood,
    );

    return day ? toResponse(day) : { date: params.date, mood: dto.mood };
  }
}

function toResponse(day: Day): DayResponse {
  return { date: day.date, mood: day.mood };
}
