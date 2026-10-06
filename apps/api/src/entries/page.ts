import { MAX_PAGE_SIZE } from '@neuron/contracts';

export interface Page {
  limit: number;
  offset: number;
}

/*
 * The default for a call inside the application. The HTTP boundary always
 * passes a real page.
 */
export const FULL_PAGE: Page = { limit: MAX_PAGE_SIZE, offset: 0 };
