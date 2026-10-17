/*
 * journal.pdf is drawn in Helvetica, one of the fonts every PDF reader has.
 * It draws the characters of Windows-1252, which is English and the other
 * Western European languages, and nothing else (ADR-025). Anything else, an
 * emoji in particular, would come out as wrong letters, so it is replaced
 * here, and never stops the export. journal.json keeps it exactly.
 */
export const REPLACEMENT = '?';

/* The 27 characters Windows-1252 has between 0x80 and 0x9F. */
const WINDOWS_1252_EXTRAS = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

function canDraw(character: string): boolean {
  const code = character.codePointAt(0)!;

  return (
    character === '\n' ||
    (code >= 0x20 && code <= 0x7e) ||
    (code >= 0xa0 && code <= 0xff) ||
    WINDOWS_1252_EXTRAS.has(character)
  );
}

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

/*
 * The text, with each character a reader sees that the font cannot draw put
 * as one REPLACEMENT. A character a reader sees may be several code points:
 * a family emoji is seven. Composed first, so that an e followed by a
 * combining accent is the one é the font has.
 */
export function drawable(text: string): string {
  const composed = text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ');

  let result = '';

  for (const { segment } of graphemes.segment(composed)) {
    result += [...segment].every(canDraw) ? segment : REPLACEMENT;
  }

  return result;
}
