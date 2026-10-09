import type { Metadata } from 'next';
import { ChooseNewPassword } from '@/app/screens/Recover';

export const metadata: Metadata = { title: 'Choose a new password · Journal' };

export default function ChooseNewPasswordPage() {
  return <ChooseNewPassword />;
}
