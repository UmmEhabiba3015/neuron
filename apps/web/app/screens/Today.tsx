import { Screen } from '@/app/components/Chrome';
import {
  Composer,
  Entry,
  MoodRow,
  Note,
  PrivateMark,
  Recording,
} from '@/app/components/Journal';
import type { Platform } from '@/lib/platform';

export function Today({ platform }: { platform: Platform }) {
  return (
    <Screen
      platform={platform}
      current="Today"
      keyLabel="Day"
      keyValue="Sun 9 Aug '26"
      glance="Sleep has come up on four of the last six days."
    >
      <main className="sheet">
        <Entry time="09:20" datetime="2026-08-09T09:20">
          The flat people said Tuesday, and it&apos;s Sunday, so I&apos;ve
          decided not to think about it until Tuesday. That lasted about an
          hour. I keep opening the email to check I read it right.
        </Entry>

        <Note citation="12 March">
          You wrote something close to this in March, about the job. That
          you&apos;d decided not to think about it until Thursday.
        </Note>

        <Recording
          platform={platform}
          time="14:05"
          datetime="2026-08-09T14:05"
          duration="2:41"
          label="Play recording, 2 minutes 41 seconds"
        >
          Walked the canal as far as the second bridge and back. Didn&apos;t
          listen to anything. There were two swans that have been there all
          summer and I&apos;ve never once seen them move.
        </Recording>

        <Note citation="3 July">
          That stretch of canal is in your entry from 3 July too. What keeps
          taking you there?
        </Note>

        <Entry time="21:40" datetime="2026-08-09T21:40" mark={<PrivateMark />}>
          Priya rang. We talked for an hour about nothing. I&apos;d forgotten
          that&apos;s a thing you can do.
        </Entry>

        <MoodRow />
      </main>

      <Composer />
    </Screen>
  );
}
