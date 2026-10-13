import type { Metadata } from 'next';
import { Talk } from '@/components/talk/Talk';

export const metadata: Metadata = { title: 'Voice memo · Journal' };

export default function TalkPage() {
  return <Talk />;
}
