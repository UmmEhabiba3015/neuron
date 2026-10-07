type Destination = 'Today' | 'Timeline' | 'Ask' | 'You';

const DESTINATIONS: { label: Destination; href: string }[] = [
  { label: 'Today', href: '/' },
  { label: 'Timeline', href: '/timeline' },
  { label: 'Ask', href: '/ask' },
  { label: 'You', href: '/you' },
];

export function Wordmark() {
  return <h1 className="wordmark">Journal</h1>;
}

/* `printed` is for a value that is the product's own words, not a date. */
export function KeyBox({
  label,
  value,
  printed,
}: {
  label: string;
  value: string;
  printed?: boolean;
}) {
  return (
    <div className="keybox">
      <span className="k">{label}</span>
      <span className={printed ? 'v printed' : 'v'}>{value}</span>
    </div>
  );
}

export function Destinations({ current }: { current: Destination }) {
  return (
    <nav className="dest" aria-label="Destinations">
      {DESTINATIONS.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          aria-current={label === current ? 'page' : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
