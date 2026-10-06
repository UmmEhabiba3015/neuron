import type { NextConfig } from "next";

/*
 * Checked here so that a missing value stops `next dev` and `next build`
 * before anything is served. Left to the browser, it would surface as
 * requests to "undefined/auth/refresh" and a screen that says it could not
 * connect, which is true and useless.
 */
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Copy apps/web/.env.example to " +
      "apps/web/.env.local and restart.",
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
