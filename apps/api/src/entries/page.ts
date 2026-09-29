export interface Page {
  limit: number;
  offset: number;
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

/*
 * The default for a call inside the application. The HTTP boundary always
 * passes a real page, because the controller defaults an absent limit to
 * DEFAULT_PAGE_SIZE.
 *
 * These live here rather than on the query DTO so that importing them does
 * not drag class-validator's decorators -- and therefore reflect-metadata --
 * into code that only wants two numbers.
 */
export const FULL_PAGE: Page = { limit: MAX_PAGE_SIZE, offset: 0 };
