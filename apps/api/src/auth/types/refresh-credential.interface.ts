/* The two halves of the refresh cookie (see refresh-cookie.ts). */
export interface RefreshCredential {
  sessionId: string;
  refreshToken: string;
}
