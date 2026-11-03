// A past day's content (06-conversation, journal-website.html #day): written once for every platform.
// Links point into the prototype, as the screens' do. Past days have no composer; the mood stays
// changeable here and only here.
export default {
  back: { label: 'Timeline', href: '00-prototype.html#timeline' },
  day: { key: 'Day', value: "Thu 6 Aug '26" },
  // The day's record, in order: entries and the product's notes on them. The product asks no questions in a day.
  record: [
    { kind: 'written', time: '22:10', datetime: '2026-08-06T22:10', excluded: false,
      text: "Slept badly again. I've stopped counting which night this is." },
    { kind: 'note', label: 'From your record', text: 'You said something like this on the second. That week you put it down to the heat.', cite: { label: '2 August', href: '00-prototype.html#day' } },
    { kind: 'written', time: '22:14', datetime: '2026-08-06T22:14', excluded: false,
      text: 'Maybe. It was cooler last night and I was still awake at three.' },
    { kind: 'written', time: '22:21', datetime: '2026-08-06T22:21', excluded: false,
      text: "The flat, mostly. And whether I'd have said yes to it if the light had been worse." },
  ],
  actions: {
    edit: { label: 'Edit entry', href: '00-prototype.html#entry-edit' },
    delete: { label: 'Delete entry', href: '00-prototype.html#entry-delete-confirm' },
  },
  mood: { label: 'Day felt', selected: 'low' },
  foot: 'Mood can be changed here, and only here.',
};
