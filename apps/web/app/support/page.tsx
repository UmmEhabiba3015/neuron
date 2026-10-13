import type { Metadata } from 'next';
import { Support } from '@/components/support/Support';

export const metadata: Metadata = {
  title: 'If you want to talk to someone · Journal',
};

export default function SupportPage() {
  return <Support />;
}
