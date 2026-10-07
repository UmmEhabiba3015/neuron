import type { Metadata } from 'next';
/*
 * In this order: lock.css is the designer's and is never edited, and live.css
 * is what a running app needs on top of it.
 */
import './styles/lock.css';
import './styles/live.css';

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
