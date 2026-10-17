import type { Metadata } from 'next';
import { YourData } from '@/components/you/YourData';

export const metadata: Metadata = { title: 'Your data · Journal' };

export default function YourDataPage() {
  return <YourData />;
}
