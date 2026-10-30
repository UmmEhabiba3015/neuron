// Ask's own words (v4 C2). The journal it shows (the exchanges, the days with chats, the bookmarks) is
// system/content/ask-journal.mjs, which the chat and drawers catalogues read too.
export default {
  title: 'Ask',
  key: 'Day',
  // where a walkthrough's links go: a reference opens that day's Day page; can't-answer offers the Timeline's search;
  // a past day's Today returns to today's Ask
  links: { day: '00-prototype.html#day', search: '00-prototype.html#timeline', today: '00-prototype.html#ask' },
};
