# srowlink

E6 in the closed inventory (direction-lock.md §6). A settings row: the setting's name, its
current value, and one sentence of explanation, as a single link. (The checkable option, `.opt`,
shares E6 but belongs to the composer and is converted with it.)

```js
use('srowlink', { label: 'Privacy', value: 'Read it', why: 'What is sent, who processes it, and how long it is kept.', href: '00-prototype.html#settings-privacy' })
```

React: `<SettingsRow label value why href />` (see `dist/types/Srowlink.props.d.ts`).

## Why

- **It carries its own flat fill.** The value is `--rule-2` and the row often sits on the open
  graph ground, so it brings the ground it needs.
- **Top-aligned.** The value sits with the label, not against the middle of a two-line block.
- **The explanation has a 38ch measure,** released from 700px (revision 25) and kept released at 1200px.
- **The value stops shrinking from 700px** (revision 32), so "Read it" never breaks onto two lines
  while the row has room.

## Do and don't

- Do keep the explanation to one sentence.
- Do let the parent place it: the auth form sets the gap below it by role (`row`).
- Don't use it for a setting that cannot change: that is not a link.
- Don't add a hover treatment or a colour; the row is quiet on purpose.

## Placement

- Placed by: the auth form (`row`).

## Legacy debt

- `srowlink.css` has no legacy contexts.
- No placement is left in `lock.css` on `.aj-c-srowlink`; the auth form places it by role (`row`).
- The comment on revision 32 still says `.srowlink`; it is kept word for word.
