import type { Metadata } from 'next';
import './styles/lock.css';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'A private space to talk about your day.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
