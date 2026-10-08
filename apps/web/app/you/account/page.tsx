import type { Metadata } from 'next';
import { Account } from '@/app/screens/You';

export const metadata: Metadata = { title: 'Account · Journal' };

export default function AccountPage() {
  return <Account />;
}
