import { MAX_PAGE_SIZE } from '@neuron/contracts';

export interface Page {
  limit: number;
  offset: number;
}

/*
 * The default for a call inside the application. The HTTP boundary always
 * passes a real page, because the controller defaults an absent limit to
 * DEFAULT_PAGE_SIZE.
 *
 * The two page sizes are the contract's, because the web app asks for pages
 * too (ADR-019).
 */
export const FULL_PAGE: Page = { limit: MAX_PAGE_SIZE, offset: 0 };
