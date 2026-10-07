import type { Metadata } from 'next';
import { AuthForm } from '@/app/screens/AuthForm';

export const metadata: Metadata = { title: 'Create an account · Journal' };

export default function CreateAccountPage() {
  return <AuthForm mode="new" />;
}
