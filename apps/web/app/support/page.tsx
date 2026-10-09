import type { Metadata } from 'next';
import { Support } from '@/app/screens/Support';

export const metadata: Metadata = {
  title: 'If you want to talk to someone · Journal',
};

export default function SupportPage() {
  return <Support />;
}
