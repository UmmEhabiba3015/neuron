import type { AuthResponse, Day, Entry } from '@neuron/contracts';
import { EntryKind } from '@neuron/contracts';
import { vi } from 'vitest';

/*
 * The API, faked at the HTTP client: `fetch` itself is replaced, so the
 * session, the screens and everything between them run as they do in a
 * browser, and no API needs to be running (ADR-026).
 *
 * Each request is recorded as "METHOD /path". A request this fake does not
 * know is answered with a 404, so a test that sends one sees it.
 *
 * `hold` names requests that are sent and never answered, so a test can look
 * at the screen while the request is in flight.
 */
export interface SentRequest {
  method: string;
  path: string;
  body: unknown;
}

export const TODAY = '2026-10-27';

export const USER: AuthResponse['user'] = {
  id: 'u1',
  email: 'reader@neuron.test',
  name: 'Reader',
  createdAt: '2026-10-01T00:00:00.000Z',
  timezone: 'Asia/Karachi',
};

export function entry(id: string, content: string): Entry {
  return {
    id,
    kind: EntryKind.Text,
    content,
    durationMs: null,
    createdAt: `${TODAY}T05:00:00.000Z`,
    date: TODAY,
  };
}

export function fakeApi({
  entries = [],
  hold = [],
}: { entries?: Entry[]; hold?: string[] } = {}) {
  const sent: SentRequest[] = [];

  function answer(status: number, body?: unknown) {
    return {
      status,
      json: async () => body,
      blob: async () => new Blob(),
      headers: { get: () => null },
    };
  }

  function route(method: string, path: string) {
    const bare = path.split('?')[0];

    if (method === 'POST' && bare === '/auth/refresh') {
      return answer(200, { accessToken: 'token', user: USER });
    }

    if (method === 'GET' && bare === '/days/today') {
      return answer(200, { date: TODAY, mood: null } satisfies Day);
    }

    if (method === 'GET' && bare === '/entries') {
      return answer(200, entries);
    }

    return answer(404, { message: 'Not Found' });
  }

  const fetch = vi.fn(
    async (url: string, init: { method: string; body?: unknown }) => {
      const path = url.replace(/^https?:\/\/[^/]+/, '');
      const body =
        typeof init.body === 'string' ? JSON.parse(init.body) : undefined;

      sent.push({ method: init.method, path, body });

      if (hold.includes(`${init.method} ${path}`)) {
        return new Promise<never>(() => {});
      }

      return route(init.method, path);
    },
  );

  vi.stubGlobal('fetch', fetch);

  return {
    sent,
    /* Every request sent, as "METHOD /path". */
    calls: () => sent.map((each) => `${each.method} ${each.path}`),
  };
}
