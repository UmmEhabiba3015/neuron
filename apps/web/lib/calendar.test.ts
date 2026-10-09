import assert from 'node:assert/strict';
import { test } from 'node:test';

import { monthRange, weeksOf, writtenDayLabel, type CalendarDay } from './calendar.ts';

/*
 * A month as the eye reads the comp: one line per week, each day its number,
 * "(n)" for a day of another month, and "[n]" for a day with entries.
 */
function drawn(weeks: CalendarDay[][]): string[] {
  return weeks.map((week) =>
    week
      .map((cell) =>
        cell.written ? `[${cell.day}]` : cell.inMonth ? `${cell.day}` : `(${cell.day})`,
      )
      .join(' '),
  );
}

test('August 2026 is drawn as 02-timeline.html draws it: Monday first, six weeks, the 3rd and 6th marked', () => {
  /* The comp also marks 1, 5, 8 and 9, for recordings. There are none. */
  assert.deepEqual(drawn(weeksOf('2026-08', ['2026-08-03', '2026-08-06'])), [
    '(27) (28) (29) (30) (31) 1 2',
    '[3] 4 5 [6] 7 8 9',
    '10 11 12 13 14 15 16',
    '17 18 19 20 21 22 23',
    '24 25 26 27 28 29 30',
    '31 (1) (2) (3) (4) (5) (6)',
  ]);
});

test('a month that starts on a Monday has no day of the month before, and one that ends on a Sunday none of the month after', () => {
  /* 1 June 2026 is a Monday; 28 February 2027 is a Sunday. */
  assert.equal(drawn(weeksOf('2026-06', []))[0], '1 2 3 4 5 6 7');
  assert.equal(drawn(weeksOf('2027-02', [])).at(-1), '22 23 24 25 26 27 28');
});

test('a February of four weeks has four weeks, and no empty one', () => {
  /* February 2027 starts on a Monday and has 28 days. */
  assert.equal(weeksOf('2027-02', []).length, 4);
});

test('a leap February has its 29th, and the year turns inside a week', () => {
  const february = weeksOf('2028-02', []).flat();
  assert.equal(february.filter((cell) => cell.inMonth).length, 29);

  const december = weeksOf('2026-12', []).flat();
  assert.equal(december.at(-1)!.date, '2027-01-03');
  assert.equal(december.at(-1)!.inMonth, false);
});

test('a date with entries outside the month is not marked, even where it is drawn', () => {
  /* 31 July is drawn in August's first week, faintly. */
  const august = weeksOf('2026-08', ['2026-07-31', '2026-09-01']).flat();

  assert.equal(august.some((cell) => cell.written), false);
  assert.equal(august.find((cell) => cell.date === '2026-07-31')!.inMonth, false);
});

test('every cell of a week is the day after the one before it', () => {
  const cells = weeksOf('2026-10', []).flat();

  for (let index = 1; index < cells.length; index += 1) {
    const before = Date.parse(`${cells[index - 1].date}T00:00:00Z`);
    const after = Date.parse(`${cells[index].date}T00:00:00Z`);
    assert.equal(after - before, 24 * 60 * 60 * 1000, cells[index].date);
  }

  /* The first cell is a Monday. */
  assert.equal(new Date(`${cells[0].date}T00:00:00Z`).getUTCDay(), 1);
});

test('the range asked of the API is the whole month, first day to last', () => {
  assert.deepEqual(monthRange('2026-08'), { from: '2026-08-01', to: '2026-08-31' });
  assert.deepEqual(monthRange('2026-09'), { from: '2026-09-01', to: '2026-09-30' });
  assert.deepEqual(monthRange('2028-02'), { from: '2028-02-01', to: '2028-02-29' });
  assert.deepEqual(monthRange('2026-12'), { from: '2026-12-01', to: '2026-12-31' });
});

test('a marked day is named as the comp names it, without the recording', () => {
  assert.equal(writtenDayLabel('2026-08-03'), '3 August, writing');
});
