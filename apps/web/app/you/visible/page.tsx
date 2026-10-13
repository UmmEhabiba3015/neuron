import type { Metadata } from 'next';
import { WhatItSees } from '@/components/you/You';

export const metadata: Metadata = { title: 'What it sees · Journal' };

export default function WhatItSeesPage() {
  return <WhatItSees />;
}
