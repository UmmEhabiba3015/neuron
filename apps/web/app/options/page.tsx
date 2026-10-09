import type { Metadata } from 'next';
import { LiveToday } from '@/app/screens/LiveToday';

export const metadata: Metadata = { title: 'Composer options · Journal' };

export default function ComposerOptionsPage() {
  return <LiveToday options />;
}
