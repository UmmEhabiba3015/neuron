# card

F2 in the closed inventory (direction-lock.md §6). A static card: a printed heading, one or
more paragraphs in the product's voice, and an optional row of actions. Today it carries the
delete-everything confirmation inside the dialog.

```js
use('card', { title: 'Delete everything?', titleId: 'delete-heading', paragraphs: ['…', '…'] }, { actions: '…' })
```

React: `<Card title="…" titleId="…" paragraphs={[…]}>{actions}</Card>` (see
`dist/types/Card.props.d.ts`).

## Why

- **Human-written, never generated.** Its words are final copy in the product's voice; nothing
  the product generated about the user's record goes in a card (direction-lock.md §6 F2).
- **Never colour-coded, never alarming.** A failure is a status paragraph that looks like every
  other paragraph; the words carry the meaning (rule 2.4).
- **Start-aligned everywhere,** including inside a centred `.stack` (revision 15).
- **38ch paragraphs, released at 700px** (revision 25). The dialog keeps the measure through
  `--aj-c-card-measure-wide` (revision 26): a confirmation stays compact so its two buttons
  stay near each other.

## Do and don't

- Do use `level: 2` only when the card carries the first heading on the page (revision 48).
- Do mark an outcome line `{ text, status: true }` so it is read out once.
- Do let the parent place it: the stack and the dialog give it its margin and width by role
  (`block`), never the card.
- Don't colour a card or add an error look; say it in words.
- Don't put a card inside a card, or use one for a one-line message (that is a notice).

## Placement

- Placed by: the stack (`block`), the dialog (`block`).
