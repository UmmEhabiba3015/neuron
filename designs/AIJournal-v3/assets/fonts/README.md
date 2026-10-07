# Portable fallback assets

Lora (prose), Source Sans 3 (printed labels) and Caveat (handwriting) are supplied
as original Google Fonts WOFF2 Latin/extended-Latin subsets. The bytes are not
modified. CSS aliases are `Journal Portable Prose`, `Journal Portable Labels`
and `Journal Portable Hand`; original Windows fonts remain first by default.

`manifest.json` records source URLs, hashes, sizes, coverage and the commit used
for the license files. `upstream-css.txt` preserves download provenance; it is
not a runtime stylesheet. The three `*-OFL.txt` files contain the copyright and
SIL Open Font License notices. Keep this directory in source/developer copies.

`scripts/portable-fonts.mjs` validates the hashes and generates embeddable font CSS. `scripts/update-portable-fonts.mjs` embeds these assets
and licenses in the marked block of `lock.css`. Normal prototype and design
system builds run it automatically and require no network connection. The
component CSS bundle also includes the fonts. Standalone HTML therefore requires
no font installation or companion asset directory.

Use `?fonts=portable` on the website or walkthrough to compare every system with
the bundled families. See `../../EXPORT-HANDOFF.md` for remaining limitations.
