import type { Metadata } from 'next';
import { Timezone } from '@/app/screens/You';

export const metadata: Metadata = { title: 'Timezone · Journal' };

export default function TimezonePage() {
  return <Timezone />;
}
