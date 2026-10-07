/*
 * Only destinations that exist are listed. Timeline, Ask and You join this
 * list on the day each is built, and not before: a link to a page that is
 * not there is a control that does nothing.
 */
const DESTINATIONS = [{ label: 'Today', href: '/' }] as const;

export type Destination = (typeof DESTINATIONS)[number]['label'];

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
