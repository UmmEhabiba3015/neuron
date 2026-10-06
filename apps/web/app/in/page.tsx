import type { Metadata } from 'next';
import '../styles/live.css';
import { AuthForm } from '@/app/screens/AuthForm';

export const metadata: Metadata = { title: 'Log in · Journal' };

export default function SignInPage() {
  return <AuthForm mode="in" />;
}
