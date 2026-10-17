import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';
import { isAfterReset } from '@/lib/recover';
import { isAfterDelete } from '@/lib/your-data';

export const metadata: Metadata = { title: 'Log in · Journal' };

/*
 * /in?reset=done is where a changed password lands, and /in?deleted=done is
 * where a deleted account lands, and sign in then says so. `searchParams` is
 * a promise in this Next.js, which is why it is awaited.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    reset?: string | string[];
    deleted?: string | string[];
  }>;
}) {
  const { reset, deleted } = await searchParams;

  return (
    <AuthForm
      mode="in"
      afterReset={isAfterReset(reset)}
      afterDelete={isAfterDelete(deleted)}
    />
  );
}
