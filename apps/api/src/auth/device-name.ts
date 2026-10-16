/*
 * The name a person reads for a device where they are signed in, such as
 * "Chrome on Windows", made from the User-Agent header of the sign-in. It is
 * made each time the sessions are listed and never stored, so a better rule
 * here renames every device at once.
 *
 * Her decision (docs/workers/feature-3-account-and-devices.md): our own
 * small function and no library. It names four browsers and six systems,
 * and nothing more.
 *
 * The order of the checks is the whole of the rule. Browsers copy each
 * other's names into the header so that sites written for one also work for
 * the others: Chrome's header contains "Safari", and Edge's contains both
 * "Chrome" and "Safari". So Edge is asked about before Chrome, and Chrome
 * and Firefox before Safari. In the same way an iPhone's header says "like
 * Mac OS X" and an Android one says "Linux", so each is asked about before
 * the system it mentions.
 */

const BROWSERS: readonly [name: string, pattern: RegExp][] = [
  ['Edge', /\bEdg(e|A|iOS)?\//],
  ['Chrome', /\b(Chrome|CriOS)\//],
  ['Firefox', /\b(Firefox|FxiOS)\//],
  ['Safari', /\bSafari\//],
];

const SYSTEMS: readonly [name: string, pattern: RegExp][] = [
  ['iPhone', /\biPhone\b/],
  ['iPad', /\biPad\b/],
  ['Android', /\bAndroid\b/],
  ['Windows', /\bWindows\b/],
  ['macOS', /\bMacintosh\b|\bMac OS X\b/],
  ['Linux', /\bLinux\b/],
];

function first(
  list: readonly [string, RegExp][],
  header: string,
): string | undefined {
  return list.find(([, pattern]) => pattern.test(header))?.[0];
}

export function deviceName(userAgent: string | null | undefined): string {
  const header = userAgent ?? '';
  const browser = first(BROWSERS, header);
  const system = first(SYSTEMS, header);

  if (browser && system) {
    return `${browser} on ${system}`;
  }

  if (system) {
    return `A browser on ${system}`;
  }

  return browser ?? 'A browser';
}
