/*
 * Sample content, lifted from the design comps.
 *
 * The designs are explicit that content is part of the deliverable and that
 * a screen making a false statement about the user's own record is a defect
 * a mechanical check cannot see (PROJECT.md section 9). So these are the
 * comps' own entries, dates and durations rather than invented ones, and the
 * totals below agree with the rows.
 *
 * This file goes when the API arrives. Nothing imports it except screens.
 */

export type TimelineItem =
  | { kind: 'entry'; lede: string; private?: boolean; source?: string }
  | { kind: 'recording'; duration: string; label: string };

export type TimelineDay = {
  date: string;
  label: string;
  items: TimelineItem[];
};

export type TimelineMonth = {
  heading: string;
  days: TimelineDay[];
};

export const TIMELINE: TimelineMonth[] = [
  {
    heading: 'August 2026',
    days: [
      {
        date: '2026-08-09',
        label: 'Sun 9',
        items: [
          {
            kind: 'entry',
            lede: "The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday.",
          },
          {
            kind: 'recording',
            duration: '2:41',
            label: 'Play recording from Sunday 9 August, 2 minutes 41 seconds',
          },
          {
            kind: 'entry',
            lede: "Priya rang. We talked for an hour about nothing. I'd forgotten that's a thing you can do.",
            private: true,
          },
        ],
      },
      {
        date: '2026-08-08',
        label: 'Sat 8',
        items: [
          {
            kind: 'recording',
            duration: '5:08',
            label: 'Play recording from Saturday 8 August, 5 minutes 8 seconds',
          },
        ],
      },
      {
        date: '2026-08-06',
        label: 'Thu 6',
        items: [
          {
            kind: 'entry',
            lede: "Slept badly again. I've stopped counting which night this is.",
          },
        ],
      },
      {
        date: '2026-08-05',
        label: 'Wed 5',
        items: [
          {
            kind: 'recording',
            duration: '11:47',
            label: 'Play recording from Wednesday 5 August, 11 minutes 47 seconds',
          },
        ],
      },
      {
        date: '2026-08-03',
        label: 'Mon 3',
        items: [
          {
            kind: 'entry',
            lede: 'Went in early to avoid the heat. Nobody else in the office until ten.',
          },
        ],
      },
      {
        date: '2026-08-01',
        label: 'Sat 1',
        items: [
          {
            kind: 'entry',
            lede: 'Bank holiday. Did nothing on purpose and it took most of the day to stop feeling odd about it.',
          },
          {
            kind: 'recording',
            duration: '3:26',
            label: 'Play recording from Saturday 1 August, 3 minutes 26 seconds',
          },
        ],
      },
    ],
  },
  {
    heading: 'July 2026',
    days: [
      {
        date: '2026-07-21',
        label: 'Tue 21',
        items: [
          {
            kind: 'entry',
            lede: 'The flat viewing. Smaller than the photos, better light.',
            source: 'Day One',
          },
        ],
      },
      {
        date: '2026-07-17',
        label: 'Fri 17',
        items: [
          {
            kind: 'entry',
            lede: 'Last day before the shutdown. Everyone left early and the building went quiet by three.',
          },
        ],
      },
    ],
  },
];

export const TOTAL = {
  entries: 148,
  recordings: 31,
  unread: '4h 12m',
};

export const SINCE = 'Since March 2026';
