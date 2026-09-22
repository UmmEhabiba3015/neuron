import type { ReactNode } from 'react';
import { deviceClass, type Platform } from '@/lib/platform';

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

export function KeyBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="keybox">
      <span className="k">{label}</span>
      <span className="v">{value}</span>
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

export function Glance({ children }: { children: ReactNode }) {
  return (
    <p className="glance">
      <span className="gline">{children}</span>
    </p>
  );
}

type ScreenProps = {
  platform: Platform;
  current: Destination;
  keyLabel: string;
  keyValue: string;
  glance?: ReactNode;
  children: ReactNode;
};

export function Screen({
  platform,
  current,
  keyLabel,
  keyValue,
  glance,
  children,
}: ScreenProps) {
  const header = (
    <>
      <Wordmark />
      <KeyBox label={keyLabel} value={keyValue} />
    </>
  );

  if (platform === 'desktop') {
    return (
      <div className={deviceClass(platform)}>
        <BrowserChrome />
        <div className="app">
          <div className="rail" aria-hidden="true" />
          <div className="title">
            {header}
            <Destinations current={current} />
            {glance ? <Glance>{glance}</Glance> : null}
          </div>
          <div className="page">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={deviceClass(platform)}>
      <BrowserChrome />
      <div className="app">
        <div className="rail" aria-hidden="true" />
        <div className="page">
          <header className="mast">{header}</header>
          <Destinations current={current} />
          {glance ? <Glance>{glance}</Glance> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

function BrowserChrome() {
  return (
    <div className="chrome" aria-hidden="true">
      <span>journal.app</span>
    </div>
  );
}
