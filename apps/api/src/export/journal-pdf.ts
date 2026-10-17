import { EntryKind, type JournalExport } from '@neuron/contracts';
import PDFDocument from 'pdfkit';
import { dayFor } from '../days/day-boundary';
import { drawable } from './drawable-text';
import type { PdfLine } from './types/pdf-line.interface';

/*
 * journal.pdf: every live entry, oldest first, under its day's date and
 * mood (ADR-025). A voice memo is "Voice memo, 2:31", with its transcript
 * under it once it has one. Times are on the clock of the person's
 * timezone, which the PDF says at the top.
 *
 * The lines are worked out first, as plain data, and drawn after. Every
 * line's text has been through drawable().
 */
export function journalPdfLines(journal: JournalExport): PdfLine[] {
  const { user } = journal;
  const lines: PdfLine[] = [
    { kind: 'title', text: drawable(`${user.name}'s journal`) },
    {
      kind: 'note',
      text: drawable(
        `Exported on ${longDate(dayFor(journal.exportedAt, user.timezone))}. Times are in ${user.timezone}.`,
      ),
    },
  ];

  if (journal.days.length === 0) {
    lines.push({ kind: 'note', text: 'There are no entries.' });
  }

  for (const day of journal.days) {
    lines.push({ kind: 'day', text: longDate(day.date) });

    if (day.mood !== null) {
      lines.push({ kind: 'mood', text: `Mood: ${day.mood}` });
    }

    for (const entry of day.entries) {
      const time = timeIn(entry.createdAt, user.timezone);

      if (entry.kind === EntryKind.Voice) {
        lines.push({
          kind: 'time',
          text: `${time}  Voice memo, ${clock(entry.durationMs ?? 0)}`,
        });
      } else {
        lines.push({ kind: 'time', text: time });
      }

      if (entry.content !== null) {
        lines.push({ kind: 'words', text: drawable(entry.content) });
      }
    }
  }

  return lines;
}

const STYLES: Record<
  PdfLine['kind'],
  { font: string; size: number; gapBefore: number }
> = {
  title: { font: 'Helvetica-Bold', size: 20, gapBefore: 0 },
  note: { font: 'Helvetica', size: 10, gapBefore: 0.4 },
  day: { font: 'Helvetica-Bold', size: 14, gapBefore: 1.6 },
  mood: { font: 'Helvetica-Oblique', size: 10, gapBefore: 0.2 },
  time: { font: 'Helvetica', size: 9, gapBefore: 0.8 },
  words: { font: 'Helvetica', size: 11, gapBefore: 0.2 },
};

export function drawJournalPdf(journal: JournalExport): Promise<Buffer> {
  const document = new PDFDocument({
    size: 'A4',
    margin: 56,
    info: { Title: drawable(`${journal.user.name}'s journal`) },
  });

  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  for (const line of journalPdfLines(journal)) {
    const style = STYLES[line.kind];

    document.moveDown(style.gapBefore);
    document.font(style.font).fontSize(style.size).text(line.text);
  }

  document.end();

  return finished;
}

/*
 * A length as a clock reads it, "2:31", counting only whole seconds, as the
 * web app shows a memo's length.
 */
export function clock(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/*
 * A stored date, YYYY-MM-DD, as "Friday 16 October 2026". It is read as
 * three numbers and never as a moment, so no timezone can move it.
 */
export function longDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return `${WEEKDAYS[weekday]} ${day} ${MONTHS[month - 1]} ${year}`;
}

/* "09:14", on the 24-hour clock of the timezone. */
function timeIn(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    numberingSystem: 'latn',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(instant));
}
