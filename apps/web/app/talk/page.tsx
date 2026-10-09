import type { Metadata } from 'next';
import { Talk } from '@/app/screens/Talk';

export const metadata: Metadata = { title: 'Voice memo · Journal' };

export default function TalkPage() {
  return <Talk />;
}
