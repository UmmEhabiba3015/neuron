import type { Metadata } from 'next';
import { LiveTimeline } from '@/app/screens/LiveTimeline';

export const metadata: Metadata = { title: 'Timeline · Journal' };

export default function TimelinePage() {
  return <LiveTimeline />;
}
