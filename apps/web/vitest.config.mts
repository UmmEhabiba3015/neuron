import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/*
 * The component tests (ADR-026): each `*.test.tsx` beside its component
 * renders the real component into jsdom, a page simulated inside Node. The
 * `lib/**\/*.test.ts` files are not run here; they stay on Node's own runner.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    include: ['components/**/*.test.tsx'],
    setupFiles: ['./test/setup.ts'],
    /* lib/utils/config.ts stops without it. No request reaches it. */
    env: { NEXT_PUBLIC_API_URL: 'http://api.test' },
  },
});
