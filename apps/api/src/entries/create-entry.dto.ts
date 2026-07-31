// A DTO — Data Transfer Object — describes data *crossing a boundary*, which
// is a different question from what a thing *is*. `JournalEntry` answers the
// second: an entry has an id and a creation time, always. This answers the
// first: of those three fields, `content` is the only one a client is allowed
// to send, because the server generates the other two (ADR-004).
//
// The inline `{ content: string }` this replaces named the right field, but it
// borrowed the name of a type that also carries `id` and `createdAt` — so it
// read as though a client might legitimately supply them.
//
// This is erased at compile time and enforces nothing at runtime. A request
// body is whatever the network delivered, and TypeScript is not there to check
// it. The hand-written validation in the controller is what actually holds
// this contract up; this type only writes it down (ADR-005).
export interface CreateEntryDto {
  content: string;
}
