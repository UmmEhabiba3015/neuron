// Copy from the screens. The long and non-Latin fixtures are stress tests, not product copy.
export default [
  { name: 'Prose', note: "The user's words in an entry (01-today).", props: { form: 'prose', text: "The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday." } },
  { name: 'Lede', note: "A day's summary line (02-timeline).", props: { form: 'lede', text: 'Slept badly again. A walk by the canal; the swans were still there.' } },
  { name: 'Copy', note: 'The explanatory sentence on an account screen (13-login).', props: { form: 'copy', text: 'Open your journal on this device.' } },
  { name: 'Copy, typed in', note: 'The same sentence with its character count: it types itself in on arrival inside the product shell (13-login).', props: { form: 'copy', chars: 33, text: 'Open your journal on this device.' } },
  { name: 'Help', note: 'A help line under a field (14-register).', props: { form: 'help', text: 'At least 8 characters.' } },
  { name: 'Error', state: 'error', note: 'A refused value is a help line too (15-auth-states).', props: { form: 'help', text: 'Enter the email address you signed up with.' } },
  { name: 'Label', note: "A voice memo's quiet label until its transcript arrives (18-entry-system-states).", props: { form: 'label', text: 'Voice memo' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { form: 'prose', text: 'A very long entry that runs on and on about the whole of a long day, the walk to the canal and back, the swans that have been there all summer, and the email that still has not been answered.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { form: 'prose', text: 'Сегодня был тихий день. 今日は静かな一日でした。' } },
];
