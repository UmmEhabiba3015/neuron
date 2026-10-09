import type { Metadata } from 'next';
import { Ask } from '@/app/screens/Ask';

export const metadata: Metadata = { title: 'Ask · Journal' };

export default function AskPage() {
  return <Ask />;
}
