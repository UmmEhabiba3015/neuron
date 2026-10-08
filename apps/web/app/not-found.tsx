import type { Metadata } from 'next';
import { AddressNotFound } from '@/app/screens/AddressNotFound';

export const metadata: Metadata = { title: 'Page not found · Journal' };

/* Shown by Next.js for an address that no page answers to. */
export default function NotFound() {
  return <AddressNotFound />;
}
