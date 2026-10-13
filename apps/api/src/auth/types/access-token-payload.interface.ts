/* What an access token carries: whose it is, and which session issued it. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  sid: string;
}
