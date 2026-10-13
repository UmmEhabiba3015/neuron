import {
  REFRESH_COOKIE_CLEAR_OPTIONS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  packRefreshCookie,
  unpackRefreshCookie,
} from './refresh-cookie';

const SESSION_ID = '0b6f1c9e-7d3a-4d8e-9f0a-2c1b5e6d7f80';
const TOKEN = 'abc_DEF-123';

describe('the refresh cookie', () => {
  it('is called neuron_refresh', () => {
    expect(REFRESH_COOKIE_NAME).toBe('neuron_refresh');
  });

  describe('its attributes', () => {
    it('are HttpOnly, SameSite=Strict, and only for /auth/refresh', () => {
      expect(REFRESH_COOKIE_OPTIONS).toMatchObject({
        httpOnly: true,
        sameSite: 'strict',
        path: '/auth/refresh',
      });
    });

    it('last exactly as long as a session: thirty days', () => {
      expect(REFRESH_COOKIE_OPTIONS.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('are not Secure until HTTPS exists (ADR-018)', () => {
      expect(REFRESH_COOKIE_OPTIONS.secure).toBeUndefined();
    });

    it('are the same when clearing, so the browser clears the same cookie', () => {
      expect(REFRESH_COOKIE_CLEAR_OPTIONS).toEqual({
        httpOnly: true,
        sameSite: 'strict',
        path: '/auth/refresh',
      });
    });
  });

  describe('packing and unpacking', () => {
    it('carries the session id and the token, separated by the first dot', () => {
      const packed = packRefreshCookie({
        sessionId: SESSION_ID,
        refreshToken: TOKEN,
      });

      expect(packed).toBe(`${SESSION_ID}.${TOKEN}`);
      expect(unpackRefreshCookie(packed)).toEqual({
        sessionId: SESSION_ID,
        refreshToken: TOKEN,
      });
    });

    it.each([
      ['no cookie at all', undefined],
      ['a value that is not text', ['a', 'b']],
      ['an empty value', ''],
      ['a value with no dot', 'no-separator-in-this-value'],
      ['no session id', `.${TOKEN}`],
      ['no token', `${SESSION_ID}.`],
    ])('reads %s as no credential', (_label, value) => {
      expect(unpackRefreshCookie(value)).toBeUndefined();
    });
  });
});
