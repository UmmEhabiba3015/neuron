/*
 * What narrows a set of entries. The listing and the count take the same
 * object and build the same where clause from it, so adding a filter here
 * reaches both and cannot reach only one.
 */
export interface EntryFilters {
  word?: string;
}
