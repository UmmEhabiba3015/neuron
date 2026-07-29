// The shape of a single journal entry, as returned over HTTP.
// Kept intentionally minimal: mood, tags, ownership, etc. are later days'
// problems (see the roadmap). Adding fields here before a real feature
// needs them is exactly the kind of speculative modeling this project
// is trying to avoid.
export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
}
