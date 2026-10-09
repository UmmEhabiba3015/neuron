import type { Metadata } from 'next';
import { YourData } from '@/app/screens/You';

export const metadata: Metadata = { title: 'Your data · Journal' };

export default function YourDataPage() {
  return <YourData />;
}
