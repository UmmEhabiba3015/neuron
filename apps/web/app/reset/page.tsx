import type { Metadata } from 'next';
import { ChooseNewPassword } from '@/components/auth/Recover';
import { tokenFrom } from '@/lib/recover';

export const metadata: Metadata = { title: 'Choose a new password · Journal' };

/*
 * Opened by the link in the email, /reset?token=... `searchParams` is a
 * promise in this Next.js, which is why it is awaited.
 */
export default async function ChooseNewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;

  return <ChooseNewPassword token={tokenFrom(token)} />;
}
