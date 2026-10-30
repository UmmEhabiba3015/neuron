# state-message

A section: a state the page is in, written where the content would be (loading, a failure,
nothing found): a line of copy or help, and sometimes a row of actions.

```js
use('state-message', { tag: 'p', text: 'No entries match those words.' })
```

## Why

- **The state takes the content's place**, inside the sheet, so a failure reads as part of the page
  rather than an interruption (no dialogs for states).

## Do and don't

- Do write the state in the product's words and offer the one action that helps.
- Don't style its copy here: the help and copy lines are the shared legacy text styles.

## Placement

- Places: `block` a notice, the page gutter; `span` a nested state message, the full grid.
- Placed by: the sheet (`span`), the entry actions (`span`), the composer (`span`), the recording row (`span`), the mood row (`span`), another state message (`span`).

## Legacy debt

- Legacy context `.sheet` (the sheet's legacy class) for its padding inside a sheet.
- Placement left in lock.css: `.state-message .auth-help{margin}` (the shared help line inside it).
  Its grid column and top margin are its parents', by role (`span`).
