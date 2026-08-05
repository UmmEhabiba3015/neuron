// What a client may send to `PATCH /entries/:id`. Structurally identical to
// `CreateEntryDto` today, and named separately anyway, for the reason ADR-005
// gave when it split `CreateEntryDto` off from `JournalEntry`: a type at a
// boundary should say which boundary it describes. Calling a PATCH body a
// `CreateEntryDto` would read as though updating an entry creates one.
//
// `content` is not optional here, and that is worth explaining rather than
// assuming. `PATCH` means "apply these changes", so in principle every field is
// optional and the body only has to carry at least one of them. There is
// exactly one updatable field today, so "at least one field is present" and
// "`content` is present" are currently the same sentence. When a second field
// arrives — mood, on Day 13 — this becomes `content?: string` and the check
// that the body is not empty stops being the same check.
//
// Like every DTO here, this is erased at compile time and enforces nothing at
// runtime. The hand-written validation in the controller is what holds the
// contract up; this type only writes it down (ADR-005).
export interface UpdateEntryDto {
  content: string;
}
