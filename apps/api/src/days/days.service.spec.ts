import { Mood } from '@neuron/contracts';
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
import { dayFor } from './day-boundary';
import { DayEntity } from './entities/day.entity';
import { DaysRepository } from './days.repository';
import { DaysService } from './days.service';

/*
 * Which date today is, and whether a date has happened yet, for one person.
 * Both are decided on the server, from its clock and the person's timezone
 * (ADR-015), so every test here sets the clock.
 */
describe('DaysService', () => {
  let dataSource: DataSource;
  let service: DaysService;

  const UTC = { id: 'in-utc', timezone: 'UTC' };
  const NEW_YORK = { id: 'in-new-york', timezone: 'America/New_York' };
  const LOS_ANGELES = { id: 'in-los-angeles', timezone: 'America/Los_Angeles' };
  const KARACHI = { id: 'in-karachi', timezone: 'Asia/Karachi' };

  const dayRowCount = async () =>
    Number(
      (
        await dataSource.query<{ c: number }[]>(
          'SELECT COUNT(*) AS c FROM days',
        )
      )[0].c,
    );

  beforeEach(async () => {
    freezeClockAt('2026-08-09T12:00:00.000Z');
    dataSource = await createTestDataSource();

    for (const { id } of [UTC, NEW_YORK, LOS_ANGELES, KARACHI]) {
      await seedUser(dataSource, id);
    }

    service = new DaysService(
      new DaysRepository(dataSource.getRepository(DayEntity)),
    );
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
    releaseClock();
  });

  describe('findToday', () => {
    /*
     * The expected date is written out and also asked of dayFor, so this
     * fails if findToday stops using the rule, and also if the rule changes.
     */
    it.each([
      ['an ordinary afternoon', '2026-08-09T15:00:00.000Z', '2026-08-09'],
      ['just before midnight', '2026-08-08T23:59:59.999Z', '2026-08-08'],
      ['midnight exactly', '2026-08-09T00:00:00.000Z', '2026-08-09'],
      ['just after midnight', '2026-08-09T00:00:01.000Z', '2026-08-09'],
      [
        '03:59, before the old 04:00 boundary',
        '2026-08-09T03:59:59.999Z',
        '2026-08-09',
      ],
      ['the small hours of new year', '2027-01-01T02:00:00.000Z', '2027-01-01'],
    ])(
      'in UTC, at %s, is the date dayFor gives',
      async (_label, instant, date) => {
        moveClockTo(instant);

        const today = await service.findToday(UTC);

        expect(today).toEqual({ date, day: undefined });
        expect(today.date).toBe(dayFor(instant, 'UTC'));
      },
    );

    /* 05:00Z on 8 October is 01:00 in New York and 22:00 the day before in Los Angeles. */
    it('gives two people two dates at the same moment', async () => {
      moveClockTo('2026-10-08T05:00:00.000Z');

      expect((await service.findToday(NEW_YORK)).date).toBe('2026-10-08');
      expect((await service.findToday(LOS_ANGELES)).date).toBe('2026-10-07');
    });

    it('carries the day, with its mood, once there is one, and only the asker’s', async () => {
      await service.setMood(KARACHI.id, '2026-08-09', Mood.Hard);
      await service.setMood(UTC.id, '2026-08-09', Mood.Good);

      expect((await service.findToday(UTC)).day?.mood).toBe(Mood.Good);
      expect((await service.findToday(NEW_YORK)).day).toBeUndefined();
    });

    it('does not create a day by being asked', async () => {
      await service.findToday(UTC);
      await service.findToday(UTC);

      expect(await dayRowCount()).toBe(0);
    });
  });

  describe('hasHappened', () => {
    /* At 20:00Z on the 9th it is 01:00 on the 10th in Karachi. */
    it.each([
      ['yesterday', '2026-08-09', true],
      ['today', '2026-08-10', true],
      ['tomorrow', '2026-08-11', false],
      ['a date years away', '2031-01-01', false],
      ['a date years ago', '2019-01-01', true],
    ])('in Karachi, says %s (%s) is %s', (_label, date, happened) => {
      moveClockTo('2026-08-09T20:00:00.000Z');

      expect(service.hasHappened(KARACHI, date)).toBe(happened);
    });

    it('turns tomorrow into today at midnight where the person is', () => {
      moveClockTo('2026-08-10T18:59:59.000Z');
      expect(service.hasHappened(KARACHI, '2026-08-11')).toBe(false);

      moveClockTo('2026-08-10T19:00:00.000Z');
      expect(service.hasHappened(KARACHI, '2026-08-11')).toBe(true);
    });

    it('can say yes to one person and no to another for one date at one moment', () => {
      moveClockTo('2026-10-08T05:00:00.000Z');

      expect(service.hasHappened(NEW_YORK, '2026-10-08')).toBe(true);
      expect(service.hasHappened(LOS_ANGELES, '2026-10-08')).toBe(false);
    });

    it('agrees with findToday about which date is today', async () => {
      moveClockTo('2026-08-09T20:00:00.000Z');
      const { date } = await service.findToday(KARACHI);

      expect(service.hasHappened(KARACHI, date)).toBe(true);
    });
  });

  /*
   * ADR-015, amendment of 2026-10-15. At 20:00Z on the 9th it is 01:00 on
   * the 10th in Karachi and 16:00 on the 9th in New York, so the 10th is
   * today for one and tomorrow for the other.
   */
  describe('exists', () => {
    const writeOn = async (owner: { id: string }, date: string) => {
      const day = await new DaysRepository(
        dataSource.getRepository(DayEntity),
      ).findOrCreate(owner.id, date);

      await dataSource.query(
        `INSERT INTO entries (id, content, created_at, user_id, day_id)
         VALUES (?, 'written', '2026-08-09T20:00:00.000Z', ?, ?)`,
        [`${owner.id}-${date}`, owner.id, day.id],
      );
    };

    beforeEach(() => {
      moveClockTo('2026-08-09T20:00:00.000Z');
    });

    it('is true for a day that has happened, written to or not', async () => {
      expect(await service.exists(NEW_YORK, '2026-08-09')).toBe(true);
      expect(await service.exists(NEW_YORK, '2019-01-01')).toBe(true);
    });

    it('is false for a future day with no entries, even with a mood', async () => {
      await new DaysRepository(dataSource.getRepository(DayEntity)).setMood(
        NEW_YORK.id,
        '2026-08-10',
        Mood.Good,
      );

      expect(await service.exists(NEW_YORK, '2026-08-10')).toBe(false);
    });

    it('is true for a future day with an entry: written in Karachi, read after a move west', async () => {
      await writeOn(KARACHI, '2026-08-10');

      expect(await service.exists(NEW_YORK, '2026-08-10')).toBe(false);
      expect(
        await service.exists(
          { ...KARACHI, timezone: NEW_YORK.timezone },
          '2026-08-10',
        ),
      ).toBe(true);
    });

    it('is false again once the entry is deleted', async () => {
      await writeOn(KARACHI, '2026-08-10');
      await dataSource.query(
        `UPDATE entries SET deleted_at = '2026-08-09T20:01:00.000Z'`,
      );

      expect(
        await service.exists(
          { ...KARACHI, timezone: NEW_YORK.timezone },
          '2026-08-10',
        ),
      ).toBe(false);
    });
  });

  describe('resolveFor', () => {
    it('files an instant under its date in the owner’s timezone, one row per date', async () => {
      const instant = '2026-10-08T05:00:00.000Z';

      const newYork = await service.resolveFor(NEW_YORK, instant);
      const losAngeles = await service.resolveFor(LOS_ANGELES, instant);
      const again = await service.resolveFor(NEW_YORK, instant);

      expect(newYork.date).toBe('2026-10-08');
      expect(losAngeles.date).toBe('2026-10-07');
      expect(again.id).toBe(newYork.id);
      expect(await dayRowCount()).toBe(2);
    });
  });
});
