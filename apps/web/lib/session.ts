/*
 * The session: who is signed in, and how every request to the API is sent.
 *
 * This file imports nothing that exists when it runs, from React, from Next
 * or from anywhere else, so that it can be tested with Node alone. The
 * address of the API and the function that sends a request are both handed
 * in.
 *
 * The one import below is of types, and the word `type` matters: Node removes
 * such an import before running the file, so it never looks for the package.
 * Without the word, the tests would stop being Node alone.
 *
 * The four rules are the owner's (ADR-018, and the Day 15c prompt):
 *
 *   1. The access token lives in a variable in memory and nowhere else.
 *   2. On load the app calls POST /auth/refresh before it decides which
 *      screen to show.
 *   3. A 401 from any other request triggers one refresh, and the request is
 *      then repeated once.
 *   4. Only one refresh runs at a time.
 *
 * Rule 4 is a correctness rule and not an optimisation. Two refresh requests
 * sent together carry the same cookie. The API rotates the token on the first
 * and reads the second as a replayed token, which revokes every session the
 * user has (ADR-014).
 */

import type { WireAuthenticated, WireUser } from '@neuron/contracts';

/*
 * `unknown` means the first refresh has not answered yet. `unreachable` means
 * it got no answer at all, which is not the same as being signed out: the
 * person may well have a good session that the app could not ask about.
 *
 * `ended` is true when a session that was in use stopped working, and false
 * for a visitor who was never signed in on this page load.
 */
export type SessionState =
  | { status: 'unknown' }
  | { status: 'unreachable' }
  | { status: 'signedIn'; user: WireUser }
  | { status: 'signedOut'; ended: boolean };

/*
 * What a request came to. `unreachable` and `ended` are kept apart on
 * purpose: no answer from the server and an answer of 401 are different
 * facts, and a screen says different things about them.
 */
export type ApiResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'rejected'; status: number; messages: string[] }
  | { kind: 'ended' }
  | { kind: 'unreachable' };

export interface RequestOptions {
  method?: string;
  body?: unknown;
}

export type Fetch = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    credentials?: 'include';
  },
) => Promise<{ status: number; json(): Promise<unknown> }>;

export interface Session {
  getState(): SessionState;
  subscribe(listener: () => void): () => void;
  restore(): Promise<SessionState>;
  login(email: string, password: string): Promise<ApiResult<WireUser>>;
  register(email: string, password: string): Promise<ApiResult<WireUser>>;
  request<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>;
}

type Answer =
  | { kind: 'answered'; status: number; body: unknown }
  | { kind: 'unreachable' };

type RefreshOutcome = 'refreshed' | 'ended' | 'unreachable';

export function createSession(config: {
  apiUrl: string;
  fetch: Fetch;
}): Session {
  const apiUrl = config.apiUrl.replace(/\/+$/, '');

  /* Rule 1. This variable is the only place the access token is ever kept. */
  let accessToken: string | undefined;

  let state: SessionState = { status: 'unknown' };
  const listeners = new Set<() => void>();

  /* Rule 4. While a refresh is in flight, this is it, and everyone waits on it. */
  let refreshInFlight: Promise<RefreshOutcome> | undefined;

  function setState(next: SessionState): void {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function signIn(body: unknown): WireUser {
    const { accessToken: token, user } = body as WireAuthenticated;

    accessToken = token;
    setState({ status: 'signedIn', user });

    return user;
  }

  async function send(
    path: string,
    options: RequestOptions,
    extras: { token?: string; withCookie?: boolean },
  ): Promise<Answer> {
    const headers: Record<string, string> = {};

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (extras.token !== undefined) {
      headers['Authorization'] = `Bearer ${extras.token}`;
    }

    try {
      const response = await config.fetch(`${apiUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
        /*
         * The web app and the API are two origins. Without this the browser
         * neither stores the cookie that login sets nor attaches it to the
         * refresh.
         */
        ...(extras.withCookie ? { credentials: 'include' as const } : {}),
      });

      /* A 204 has no body, and reading one that is not JSON must not throw. */
      const body: unknown = await response.json().catch(() => undefined);

      return { kind: 'answered', status: response.status, body };
    } catch {
      /*
       * `fetch` rejects only when no answer arrived: the server is down, the
       * network is, or the browser withheld the response under CORS. A 401
       * is an answer and never lands here.
       */
      return { kind: 'unreachable' };
    }
  }

  function refresh(): Promise<RefreshOutcome> {
    if (refreshInFlight) {
      return refreshInFlight;
    }

    const attempt = (async (): Promise<RefreshOutcome> => {
      const answer = await send(
        '/auth/refresh',
        { method: 'POST' },
        { withCookie: true },
      );

      if (answer.kind === 'unreachable') {
        return 'unreachable';
      }

      if (answer.status !== 200) {
        accessToken = undefined;
        return 'ended';
      }

      signIn(answer.body);
      return 'refreshed';
    })();

    refreshInFlight = attempt;

    void attempt.finally(() => {
      refreshInFlight = undefined;
    });

    return attempt;
  }

  /*
   * Rule 2. Asked for by every screen when it mounts, and React in
   * development mounts twice, so calls made together share one refresh and
   * calls made after the answer is known send nothing at all.
   */
  async function restore(): Promise<SessionState> {
    if (state.status === 'signedIn' || state.status === 'signedOut') {
      return state;
    }

    if (state.status === 'unreachable') {
      setState({ status: 'unknown' });
    }

    const outcome = await refresh();

    if (outcome === 'ended') {
      setState({ status: 'signedOut', ended: false });
    } else if (outcome === 'unreachable') {
      setState({ status: 'unreachable' });
    }

    return state;
  }

  function endSession(): ApiResult<never> {
    accessToken = undefined;
    setState({ status: 'signedOut', ended: true });

    return { kind: 'ended' };
  }

  function resultOf<T>(answer: Answer): ApiResult<T> {
    if (answer.kind === 'unreachable') {
      return { kind: 'unreachable' };
    }

    if (answer.status >= 200 && answer.status < 300) {
      return { kind: 'ok', data: answer.body as T };
    }

    return {
      kind: 'rejected',
      status: answer.status,
      messages: messagesOf(answer.body),
    };
  }

  /* Rule 3. */
  async function request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> {
    const tokenSent = accessToken;
    const first = await send(path, options, { token: tokenSent });

    if (first.kind === 'unreachable' || first.status !== 401) {
      return resultOf<T>(first);
    }

    /*
     * If the token has changed since this request left, another request has
     * already refreshed, and the new token only needs to be used. Otherwise
     * refresh, or join the refresh that is running.
     */
    if (accessToken === undefined || accessToken === tokenSent) {
      const outcome = await refresh();

      if (outcome === 'unreachable') {
        return { kind: 'unreachable' };
      }

      if (outcome === 'ended') {
        return endSession();
      }
    }

    /* Repeated once, and this answer is final whatever it is. */
    const second = await send(path, options, { token: accessToken });

    if (second.kind === 'answered' && second.status === 401) {
      return endSession();
    }

    return resultOf<T>(second);
  }

  /*
   * Login and register do not go through `request`. A 401 from login means
   * the details were wrong, and refreshing would be the wrong answer to it.
   */
  async function login(
    email: string,
    password: string,
  ): Promise<ApiResult<WireUser>> {
    const answer = await send(
      '/auth/login',
      { method: 'POST', body: { email, password } },
      { withCookie: true },
    );

    if (answer.kind === 'answered' && answer.status === 200) {
      return { kind: 'ok', data: signIn(answer.body) };
    }

    return resultOf<WireUser>(answer);
  }

  async function register(
    email: string,
    password: string,
  ): Promise<ApiResult<WireUser>> {
    return resultOf<WireUser>(
      await send(
        '/auth/register',
        { method: 'POST', body: { email, password } },
        {},
      ),
    );
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    restore,
    login,
    register,
    request,
  };
}

/*
 * The API's error body carries `message` as one string, or as an array of
 * strings when validation refused the input.
 */
function messagesOf(body: unknown): string[] {
  const message = (body as { message?: unknown } | undefined)?.message;

  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string');
  }

  return typeof message === 'string' ? [message] : [];
}
