import type { Metadata } from 'next';
import { You } from '@/app/screens/You';

export const metadata: Metadata = { title: 'You · Journal' };

export default function YouPage() {
  return <You />;
}
