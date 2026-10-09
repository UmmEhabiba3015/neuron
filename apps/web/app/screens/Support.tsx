'use client';

import Link from 'next/link';
import { Gate } from '@/app/components/Gate';
import { JournalBox, LiveScreen } from '@/app/components/LiveScreen';
import { NotBuiltInPlace } from '@/app/components/NotBuilt';
import { UNBUILT } from '@/lib/unbuilt';

/*
 * The support resource, from #support-resource in
 * 18-entry-system-states.html: a page of real help for a person in distress
 * (docs/requirements.md 3.9.2).
 * Its words are the owner's to write, and are not written yet, so the page
 * has its heading and the sentence (lib/unbuilt.ts). The designer's text,
 * a helpline for one country, is not used.
 *
 * It is reached from the composer's options and from Privacy, and has a way
 * back to each, as the comp does.
 */
export function Support() {
  return <Gate>{() => <SupportPage />}</Gate>;
}

function SupportPage() {
  return (
    <LiveScreen current="Today" surface aside={<JournalBox />}>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">{UNBUILT.supportResource.label}</h2>
          <NotBuiltInPlace name="supportResource" className="auth-copy" />
          <div className="auth-actions">
            <Link className="btn quiet" href="/options">
              Back to options
            </Link>
            <Link className="btn quiet" href="/you/privacy">
              Back to settings
            </Link>
          </div>
        </div>
      </main>
    </LiveScreen>
  );
}
