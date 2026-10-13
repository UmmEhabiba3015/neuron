import type { Metadata } from 'next';
import { YourData } from '@/components/you/You';

export const metadata: Metadata = { title: 'Your data · Journal' };

export default function YourDataPage() {
  return <YourData />;
}
