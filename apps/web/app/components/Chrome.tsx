import Link from 'next/link';

/*
 * The four destinations, in the designer's order. Ask is a page now, though
 * asking is not built (lib/unbuilt.ts): a link between screens is not a
 * feature, and it goes somewhere.
 *
 * Each one is a Link, so moving between them does not load the page again.
 * A fresh load would drop the access token, which lives only in memory
 * (ADR-018), and every destination would begin with a refresh.
 */
const DESTINATIONS = [
  { label: 'Today', href: '/' },
  { label: 'Timeline', href: '/timeline' },
  { label: 'Ask', href: '/ask' },
  { label: 'You', href: '/you' },
] as const;

export type Destination = (typeof DESTINATIONS)[number]['label'];

export function Wordmark({ children = 'Journal' }: { children?: string }) {
  return <h1 className="wordmark">{children}</h1>;
}

/*
 * `printed` is for a value that is the product's own words, not a date.
 * `heading` is for a page whose title is the value itself: the page of one
 * day has no wordmark, and its date is its heading (06-conversation.html).
 */
export function KeyBox({
  label,
  value,
  printed,
  heading,
}: {
  label: string;
  value: string;
  printed?: boolean;
  heading?: boolean;
}) {
  return (
    <div className="keybox">
      <span className="k">{label}</span>
      {heading ? (
        <h1 className="v">{value}</h1>
      ) : (
        <span className={printed ? 'v printed' : 'v'}>{value}</span>
      )}
    </div>
  );
}

/* `current` is null on a screen that is none of the destinations. */
export function Destinations({ current }: { current: Destination | null }) {
  return (
    <nav className="dest" aria-label="Destinations">
      {DESTINATIONS.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          aria-current={label === current ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/* The way back from a pushed page, as 06-conversation.html draws it. */
export function Back({ href, children }: { href: string; children: string }) {
  return (
    <Link className="back" href={href}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {children}
    </Link>
  );
}
