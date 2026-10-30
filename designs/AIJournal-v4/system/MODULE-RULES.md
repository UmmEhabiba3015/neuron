# Module rules, on one page

What `tools/ci/check-modules.mjs` enforces, and the migration conventions decided so far
(DESIGN.md, Decisions). Read this instead of the checker's source.

## Layers and names

| Layer | Folder | Class prefix | May use (`uses` in the contract) | Responds with |
|---|---|---|---|---|
| layout | `system/modules/layout/` | `aj-l-` | nothing | `@container` and `@media` |
| components | `system/modules/components/` | `aj-c-` | layout, other components | `@container`; `@media` only for preferences and input (reduced motion, hover, pointer), or around rules that are all legacy contexts |
| sections | `system/modules/sections/` | `aj-s-` | layout, components | `@container` only |
| pages | `system/modules/pages/` | `aj-p-` | sections (and lower layers) | no CSS, no markup of their own |

Layers stack `tokens < base < legacy < layout < components < sections < pages`: **any** module
rule beats **any** legacy rule on the same element, whatever the specificity.

## A module's own CSS

| Rule | Check |
|---|---|
| Every selector starts from the module's root class or one of its elements (`.aj-c-card`, `.aj-c-card__title`) | `global` |
| Never another module's class, not even as context; style a child through the custom properties it exposes | `cross-module` |
| A context from legacy CSS (`.device.d`, `.app.ios`, `.auth-paper`, `:where(#journal)`) needs a `/* legacy-context: why */` comment on the rule; it is listed as debt | `global` |
| No ids, no `!important`, no `@layer`/`@import`/`@font-face`; keyframes and `@property` named after the module | `global`, `important`, `layer` |
| No reaching through a slot into what the parent put there | `donut` |
| Values from `system/tokens.json`; a literal needs `/* token-exempt: why */` | `hard-coded`, `unknown-token` |
| Custom properties it sets are its own (`--aj-c-card-…`); never a token or another module's | `tokens` |
| `tokens.reads` in the contract lists exactly the tokens the CSS reads | `contract-tokens` |
| Variants are `data-*` attributes (`[data-platform="desktop"]`), every non-default value has a rule and a fixture (a value whose only rules are still legacy CSS says why in `variants.<name>.noRule.<value>`; a comment naming the selector does not count) | `contract-coverage` |
| Every state marked `yes` has a fixture; text content has `long` and `non-latin` fixtures | `contract-coverage` |
| A new component must be on the closed inventory (`design-ci.json`) | `inventory` |

## Legacy CSS (lock.css `@layer legacy`) during the migration

| May | May not |
|---|---|
| Place a module: margin, width, grid and flex placement, `display:none` | Set anything else on a module class (`legacy-leak`) |
| Set custom properties a module exposes | Set a placement property the module also sets: the module wins and the rule silently does nothing (`legacy-conflict`) |
| Keep using a legacy class the element still carries as context (`.app .said`) | Use a module class as context (`.aj-l-shell .said`, `legacy-leak`) |

## Converting an existing component (decided in waves 1–4)

1. **Keep the legacy classes** on the element and put the module class first
   (`aj-l-shell app`). List them in the contract's `legacyClasses`; `check-modules` reports who
   still reads each and warns when nothing does (then drop it).
2. **Move every rule whose subject is the element**, mapping each legacy class to one module class
   or attribute so specificity and order are unchanged. Rules from the website preview move
   behind `:where(#journal)`.
3. **What stays in legacy:** custom-property declarations read by legacy children (`--gut`,
   `--lead`), `!important` declarations, and rules whose subject is a child.
4. **Markup** with `tools/convert/add-module-class.mjs <map.json>` (screens, the guide source, script
   literals; never tests); a part class several components share takes `"inside"`; `--check`
   lists what it can't do. Build scripts find markup with `openTag()`
   (`tools/lib/html-structure.mjs`), never by an exact class string.
5. **Never commit generated output** on a module branch; the wave's rebuild commits it.
