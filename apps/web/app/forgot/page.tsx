import type { Metadata } from 'next';
import { ForgotPassword } from '@/components/auth/Recover';

export const metadata: Metadata = { title: 'Reset your password · Journal' };

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
