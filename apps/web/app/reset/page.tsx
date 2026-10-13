import type { Metadata } from 'next';
import { ChooseNewPassword } from '@/components/auth/Recover';

export const metadata: Metadata = { title: 'Choose a new password · Journal' };

export default function ChooseNewPasswordPage() {
  return <ChooseNewPassword />;
}
