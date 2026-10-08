import type { Metadata } from 'next';
import { LiveDay } from '@/app/screens/LiveDay';

export const metadata: Metadata = { title: 'A day · Journal' };

/*
 * The folder is named [date], so whatever stands after /d/ in the address
 * arrives here as `params.date`. It is text, and may be anything a person
 * typed. `params` is a promise in this Next.js, which is why it is awaited.
 *
 * `key` gives each date its own screen, so one day's entries are never drawn
 * under another day's date.
 */
export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  return <LiveDay key={date} date={date} />;
}
