# composer

E1 in the closed inventory (direction-lock.md §6). The composer: sticky at the foot of Today, never on
any other screen. A row holds the field and exactly one filled control, the record control (the
`mic` part) while the field is empty and send while it holds words; below it the tools row with the
keep-out-of-memory option and More options. On the website's Today it is the writing companion
(`form: 'companion'`), with the recent overview above the row.

```js
use('composer', { form: 'plain' }, { row: field, tools })
```

React: `<Composer form="plain" placeholder="Add to today">{row}{tools}</Composer>`.

The chat form (`form: 'chat'`, v4 C2) is Ask's composer: a `form` element with the lead slot, a rounded
field (a textarea and the round Ask button) and the note on a slip. `readonly` swaps all three for the
past day's dashed slip with a quiet Back to today; `waiting` draws the field at 60% while a day loads.
It is sticky at the foot over a fade, with no top rule, rise, tuck, mic or tools row, and no script
(the app runtime handles Enter and sizing). The parent gives it the chat column's width.

```js
use('composer', { form: 'chat', note }, { lead })
```

## Why

- **One filled control, two states.** The mic and send share one box (revision 12); the mic is the
  composer's own part, and the render function leaves it out when the row already holds send.
- **It moves on four occasions and no others.** It rises 64px when the app opens, tucks the same
  64px while the journal is read, comes back up on scroll back, and rises when focus is inside it
  (the motion comments in `composer.css` give the reasons). Only the Today composer, the one with the
  option, moves; it does not enter twice on one screen.
- **Under reduced motion the motion is removed,** not shortened.
- **At 1200px its content centres on the sheet,** a 700px column inside a rule that still spans the page.

## Do and don't

- Do put the field, then send when it holds words, in the `row` slot; leave the mic to the module.
- Do pass the option and a button in `tools` for the tools row, or the option alone for the iOS form
  (no tools row).
- Don't add a third permanent button; the empty state is most of the life of the screen.
- Chat form: no mic, tools row or send module in it; the Ask button is its own. The label's id is the
  `fieldId` (default `aj-ask`), so one chat composer stands on a screen; the catalogue gives each fixture its own.
- Don't use the plain or companion form off Today; it is sticky and carries the rise.

## Placement

- Places: `head` the overview above the input, `--s5` below; `span` a state message, the full grid, `--s4` above; `option` the option, `--s3` above (in the composer or its tools); `fixed` the tools' quiet button, keeps its size.
- Placed by: the page (`foot`).

## Legacy debt

- `.app .aj-c-composer:has(.opt)` (and `.app.restate`): the shell is the motion scope, and `.opt`,
  the option's legacy class, marks the Today composer. `.app` also scopes the mic's glide and press rules.
- `lock.css` keeps no placement for the composer: the page pushes it to the foot by role (`foot`), and
  the composer places its option and the tools' quiet button by role.
- `lock.css` keeps the navbar runtime's rules (`.composer.writing-companion{…!important…}`,
  `.navbar-page>.composer`) and `.app:has(>.page>.composer) .journal-header`.
- `.crow` is shared: the base `.crow` rule stays for the Ask search row (`.crow.find`, `.mast > .crow`);
  `.aj-c-composer__row` copies its declarations. The search row converts with its page.
- The legacy classes `composer`, `crow`, `mic`, `composer-tools`, `writing-companion` stay on the elements.

## The voice memo draft (v4 C5, 0.4.0)

The `draft` slot holds the memo draft line (`pending`, form `draft`, place `span`) under the row and before the
tools, with or without words in the field, on Today and Empty Today. The page gives it the hook `draft`; it opens the
recorder on the draft, as the mic does while a draft exists. Never above the row: the head is the overview's. The
`after` slot no longer holds a save-failed line: an entry that doesn't upload is in the list with its own line.

```js
use('composer', { form: 'companion' }, { overview, row: field, draft: use('pending', { form: 'draft', …, place: 'span', hook: 'draft' }), tools })
```
