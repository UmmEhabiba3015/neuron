// Copy from the screens (01-today, mobile-app/01-today). The shell is a stand-in written in
// legacy classes until the shell module exists; it renders unstyled on the catalogue page.
// The long and non-Latin fixtures are stress tests, not product copy.
const shell = '<div class="app"><div class="page"><header class="mast"><h1 class="wordmark">Journal</h1></header></div></div>';
const caption = { captionTitle: 'Today · settled day', captionText: 'Journal v3 design of record. Product behavior and state transitions are specified in V3-REVISION.md.' };
export default [
  { name: 'Mobile', note: 'The default, 390 wide, with its caption (mobile-web/01-today).', props: { platform: 'mobile', chromeLabel: 'journal.app', ...caption }, slots: { children: shell } },
  { name: 'Tablet', note: 'Tablet, 834 wide; it never shrinks, the window scrolls sideways instead (revisions 19 and 30).', props: { platform: 'tablet', chromeLabel: 'journal.app', ...caption }, slots: { children: shell } },
  { name: 'Desktop', note: 'Desktop, 1440 wide; it never shrinks (revision 33).', props: { platform: 'desktop', chromeLabel: 'journal.app', ...caption }, slots: { children: shell } },
  { name: 'iOS', note: 'The native stage: a status bar in place of the browser bar, and the home indicator (revision 47, mobile-app/01-today).', props: { platform: 'ios', statusTime: '21:58', captionTitle: 'Today . mobile app 390x844 . iOS . Pro, settled day' }, slots: { children: shell } },
  { name: 'No caption', note: 'A stage without a caption.', props: { platform: 'mobile', chromeLabel: 'journal.app' }, slots: { children: shell } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long address and a long caption.', props: { platform: 'mobile', chromeLabel: 'journal.app/this/is/a/very/long/address/that/keeps/going/and/going/past/the/end', captionTitle: caption.captionTitle + ' ' + caption.captionTitle, captionText: caption.captionText + ' ' + caption.captionText }, slots: { children: shell } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { platform: 'mobile', chromeLabel: 'журнал.app 日記', captionTitle: 'Сегодня · 今日', captionText: 'Это проверка нелатинского текста. 日本語の確認用の文章です。' }, slots: { children: shell } },
];
