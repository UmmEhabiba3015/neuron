import type { Metadata } from 'next';
import { Timezone } from '@/components/you/You';

export const metadata: Metadata = { title: 'Timezone · Journal' };

export default function TimezonePage() {
  return <Timezone />;
}
