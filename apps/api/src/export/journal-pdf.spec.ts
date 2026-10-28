import { EntryKind, Mood, type JournalExport } from '@neuron/contracts';
import { REPLACEMENT } from './drawable-text';
import {
  clock,
  drawJournalPdf,
  journalPdfLines,
  longDate,
} from './journal-pdf';

const journal = (days: JournalExport['days']): JournalExport => ({
  exportedAt: '2026-10-16T20:00:00.000Z',
  user: {
    id: 'u1',
    email: 'habiba@example.com',
    name: 'Habiba',
    createdAt: '2026-10-01T00:00:00.000Z',
    timezone: 'Asia/Karachi',
  },
  days,
});

const typed = (
  id: string,
  content: string,
  createdAt: string,
  date: string,
) => ({
  id,
  kind: EntryKind.Text,
  content,
  durationMs: null,
  createdAt,
  date,
  keptOutOfMemory: false,
});

describe('journalPdfLines', () => {
  it('opens with whose journal it is, the date exported, and the timezone of the times', () => {
    expect(journalPdfLines(journal([])).slice(0, 2)).toEqual([
      { kind: 'title', text: "Habiba's journal" },
      {
        kind: 'note',
        /* 20:00Z is already the 17th in Karachi. */
        text: 'Exported on Saturday 17 October 2026. Times are in Asia/Karachi.',
      },
    ]);
  });

  it('says so when there is nothing in it', () => {
    expect(journalPdfLines(journal([])).at(-1)).toEqual({
      kind: 'note',
      text: 'There are no entries.',
    });
  });

  it('keeps the days and entries in the order given, each day with its date and mood', () => {
    const lines = journalPdfLines(
      journal([
        {
          date: '2026-10-15',
          mood: Mood.Low,
          entries: [
            typed('a', 'first', '2026-10-15T04:00:00.000Z', '2026-10-15'),
          ],
        },
        {
          date: '2026-10-16',
          mood: null,
          entries: [
            typed('b', 'second', '2026-10-16T04:00:00.000Z', '2026-10-16'),
            typed('c', 'third', '2026-10-16T05:30:00.000Z', '2026-10-16'),
          ],
        },
      ]),
    ).slice(2);

    expect(lines).toEqual([
      { kind: 'day', text: 'Thursday 15 October 2026' },
      { kind: 'mood', text: 'Mood: Low' },
      { kind: 'time', text: '09:00' },
      { kind: 'words', text: 'first' },
      { kind: 'day', text: 'Friday 16 October 2026' },
      { kind: 'time', text: '09:00' },
      { kind: 'words', text: 'second' },
      { kind: 'time', text: '10:30' },
      { kind: 'words', text: 'third' },
    ]);
  });

  it('lists a memo as "Voice memo" with its length, and its transcript when it has one', () => {
    const memo = (id: string, content: string | null) => ({
      id,
      kind: EntryKind.Voice,
      content,
      durationMs: 151_900,
      createdAt: '2026-10-16T04:00:00.000Z',
      date: '2026-10-16',
      keptOutOfMemory: false,
    });

    const lines = journalPdfLines(
      journal([
        {
          date: '2026-10-16',
          mood: null,
          entries: [memo('m1', null), memo('m2', 'what I said')],
        },
      ]),
    ).slice(3);

    expect(lines).toEqual([
      { kind: 'time', text: '09:00  Voice memo, 2:31' },
      { kind: 'time', text: '09:00  Voice memo, 2:31' },
      { kind: 'words', text: 'what I said' },
    ]);
  });

  /* Her decision 3a: the PDF is the same whether an entry is kept out or not. */
  it('draws an entry kept out of memory exactly as one in memory', () => {
    const day = (keptOutOfMemory: boolean) =>
      journal([
        {
          date: '2026-10-16',
          mood: null,
          entries: [
            {
              ...typed(
                'e1',
                'private',
                '2026-10-16T04:00:00.000Z',
                '2026-10-16',
              ),
              keptOutOfMemory,
            },
          ],
        },
      ]);

    expect(journalPdfLines(day(true))).toEqual(journalPdfLines(day(false)));
  });

  it('replaces what the font cannot draw, in the words and in the name', () => {
    const exported = journal([
      {
        date: '2026-10-16',
        mood: null,
        entries: [
          typed('a', 'sunny 😀', '2026-10-16T04:00:00.000Z', '2026-10-16'),
        ],
      },
    ]);
    exported.user.name = 'Habiba 🌸';

    const lines = journalPdfLines(exported);

    expect(lines[0].text).toBe(`Habiba ${REPLACEMENT}'s journal`);
    expect(lines.at(-1)).toEqual({
      kind: 'words',
      text: `sunny ${REPLACEMENT}`,
    });
  });
});

describe('drawJournalPdf', () => {
  it('draws a PDF, emoji and all, without stopping', async () => {
    const pdf = await drawJournalPdf(
      journal([
        {
          date: '2026-10-16',
          mood: Mood.Good,
          entries: [
            typed('a', '👩‍👩‍👧 ✓ سلام', '2026-10-16T04:00:00.000Z', '2026-10-16'),
          ],
        },
      ]),
    );

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.subarray(-6).toString()).toContain('%%EOF');
  });
});

describe('clock and longDate', () => {
  it('counts only whole seconds, as the web app does', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(151_999)).toBe('2:31');
    expect(clock(600_000)).toBe('10:00');
  });

  it('reads a stored date as three numbers', () => {
    expect(longDate('2026-10-16')).toBe('Friday 16 October 2026');
  });
});
