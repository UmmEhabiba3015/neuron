import type { Metadata } from 'next';
import { Account } from '@/components/you/You';

export const metadata: Metadata = { title: 'Account · Journal' };

export default function AccountPage() {
  return <Account />;
}
