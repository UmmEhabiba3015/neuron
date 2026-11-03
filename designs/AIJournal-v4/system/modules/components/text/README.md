# text

The product's shared text styles as one component: the user's words (`prose`), a day's lede
(`lede`), an account screen's explanatory sentence (`copy`), a help, error or status line (`help`),
and a voice memo's quiet label (`label`). It is typography only.

## Why

These five styles were global classes in lock.css (`.prose`, `.lede`, `.auth-copy`, `.auth-help`,
`.prose.audio-label`), shared by rows, the auth form, state messages and the entry editor. One
component keeps them in the module rules and checks (decision 2026-10-12, inventory 35).

## Do and don't

- Do choose the form by what the text is, not where it sits.
- Do set `chars` only on authored copy (its measured character count), never on user input.
- Don't give it a margin: its parent places it by role (`copy`, `help`, `note`).

## Placement

- Placed by: the auth form (`copy`; `help` and `note` in a field), the sheet (`copy`), the state
  message (`copy`, `help`).

## Legacy debt

- The markup keeps the legacy classes (`prose`, `lede`, `auth-copy`, `auth-help`, `audio-label`):
  the runtime and the generators find entries and lines by them (behaviour phase).
