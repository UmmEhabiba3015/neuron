import { Mood } from '@neuron/contracts';
import { NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import {
  freezeClockAt,
  moveClockTo,
  releaseClock,
} from '../../test/support/clock';
import {
  closeTestDataSource,
  createTestDataSource,
  seedUser,
} from '../../test/support/test-database';
import type { AuthenticatedRequest } from '../shared/types/authenticated-request.interface';
import { DayEntity } from './entities/day.entity';
import { DaysController } from './days.controller';
import { DaysRepository } from './days.repository';
import { DaysService } from './days.service';

/*
 * A day that has not happened yet, and has no entry, does not exist: asking
 * for it, or setting its mood, is a 404, and nothing is written. A day that has happened and
 * was never touched is a real day with nothing on it yet.
 *
 * The caller is in Karachi. At 20:00Z on the 9th it is 01:00 on the 10th
 * there, so the 11th is tomorrow.
 */
describe('DaysController', () => {
  let dataSource: DataSource;
  let controller: DaysController;

  const KARACHI = 'in-karachi';
  const caller = {
    user: { id: KARACHI, timezone: 'Asia/Karachi' },
  } as unknown as AuthenticatedRequest;

  const dayRows = () =>
    dataSource.query<{ date: string; mood: string | null }[]>(
      `SELECT date, mood FROM days ORDER BY date`,
    );

  const refusal = async (attempt: Promise<unknown>) => {
    const error = await attempt.then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(NotFoundException);

    return (error as NotFoundException).message;
  };

  beforeEach(async () => {
    freezeClockAt('2026-08-09T20:00:00.000Z');
    dataSource = await createTestDataSource();
    await seedUser(dataSource, KARACHI);

    controller = new DaysController(
      new DaysService(new DaysRepository(dataSource.getRepository(DayEntity))),
    );
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  it('answers today, and a past day nobody touched, with no mood', async () => {
    expect(await controller.findToday(caller)).toEqual({
      date: '2026-08-10',
      mood: null,
    });
    expect(await controller.findByDate({ date: '2019-01-01' }, caller)).toEqual(
      { date: '2019-01-01', mood: null },
    );
    expect(await dayRows()).toEqual([]);
  });

  it('sets the mood of today and of yesterday', async () => {
    expect(
      await controller.setMood(
        { date: '2026-08-10' },
        { mood: Mood.Even },
        caller,
      ),
    ).toEqual({ date: '2026-08-10', mood: 'Even' });
    expect(
      await controller.setMood({ date: '2026-08-09' }, { mood: null }, caller),
    ).toEqual({ date: '2026-08-09', mood: null });
  });

  it('refuses a future day with a 404 in the form of a missing entry, and writes nothing', async () => {
    expect(
      await refusal(controller.findByDate({ date: '2026-08-11' }, caller)),
    ).toBe('Day with date 2026-08-11 not found');
    expect(
      await refusal(
        controller.setMood({ date: '2026-08-11' }, { mood: Mood.Good }, caller),
      ),
    ).toBe('Day with date 2026-08-11 not found');
    await refusal(
      controller.setMood({ date: '2031-01-01' }, { mood: null }, caller),
    );

    expect(await dayRows()).toEqual([]);
  });

  /*
   * Before future days were refused a mood could be set on any date, so a
   * row on a future date may already be stored. It is neither deleted nor
   * changed; it is not there to be asked for until its date arrives.
   */
  it('hides a future day that is already stored, leaves it alone, and shows it on the day', async () => {
    await dataSource.query(
      `INSERT INTO days (id, date, mood, created_at, user_id)
       VALUES ('set-early', '2026-08-11', 'Hard', '2026-08-01T10:00:00.000Z', ?)`,
      [KARACHI],
    );

    await refusal(controller.findByDate({ date: '2026-08-11' }, caller));
    await refusal(
      controller.setMood({ date: '2026-08-11' }, { mood: Mood.Light }, caller),
    );
    expect(await dayRows()).toEqual([{ date: '2026-08-11', mood: 'Hard' }]);

    moveClockTo('2026-08-11T06:00:00.000Z');

    expect(await controller.findByDate({ date: '2026-08-11' }, caller)).toEqual(
      { date: '2026-08-11', mood: 'Hard' },
    );
  });

  /*
   * ADR-015, amendment of 2026-10-15: a future day with an entry exists. An
   * entry on the 11th is in the future for the caller, which only a change
   * of timezone can bring about, and its day answers and takes a mood.
   */
  it('answers a future day that has an entry, and sets its mood', async () => {
    await dataSource.query(
      `INSERT INTO days (id, date, mood, created_at, user_id)
       VALUES ('ahead', '2026-08-11', NULL, '2026-08-09T20:00:00.000Z', ?)`,
      [KARACHI],
    );
    await dataSource.query(
      `INSERT INTO entries (id, content, created_at, user_id, day_id)
       VALUES ('e1', 'written further east', '2026-08-09T20:00:00.000Z', ?, 'ahead')`,
      [KARACHI],
    );

    expect(await controller.findByDate({ date: '2026-08-11' }, caller)).toEqual(
      { date: '2026-08-11', mood: null },
    );
    expect(
      await controller.setMood(
        { date: '2026-08-11' },
        { mood: Mood.Light },
        caller,
      ),
    ).toEqual({ date: '2026-08-11', mood: 'Light' });
  });

  it('lists a range that ends in the future as it would any other', async () => {
    expect(
      await controller.findInRange(
        { from: '2026-08-01', to: '2031-12-31' },
        caller,
      ),
    ).toEqual([]);
  });
});
