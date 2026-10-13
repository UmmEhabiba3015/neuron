import type { Metadata } from 'next';
import { Ask } from '@/components/ask/Ask';

export const metadata: Metadata = { title: 'Ask · Journal' };

export default function AskPage() {
  return <Ask />;
}
