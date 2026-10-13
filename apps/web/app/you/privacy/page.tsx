import type { Metadata } from 'next';
import { Privacy } from '@/components/you/You';

export const metadata: Metadata = { title: 'Privacy · Journal' };

export default function PrivacyPage() {
  return <Privacy />;
}
