import type { Metadata } from 'next';
import { You } from '@/components/you/You';

export const metadata: Metadata = { title: 'You · Journal' };

export default function YouPage() {
  return <You />;
}
