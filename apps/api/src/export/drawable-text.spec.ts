import { REPLACEMENT, drawable } from './drawable-text';

describe('drawable', () => {
  it('leaves English, Western European letters and typographic punctuation as they are', () => {
    const text = 'Café, naïve “quotes” – dashes — and… 50 € ½ ß Ñ';

    expect(drawable(text)).toBe(text);
  });

  it('keeps line breaks, and makes every kind of line break the same one', () => {
    expect(drawable('one\r\ntwo\rthree\nfour')).toBe('one\ntwo\nthree\nfour');
  });

  it.each([
    ['an emoji', 'good day 😀', `good day ${REPLACEMENT}`],
    ['an emoji of several code points', 'us 👩‍👩‍👧 here', `us ${REPLACEMENT} here`],
    ['an emoji with a variation selector', 'love ❤️', `love ${REPLACEMENT}`],
    ['a tick', 'done ✓', `done ${REPLACEMENT}`],
    ['another script', 'سلام', REPLACEMENT.repeat(4)],
  ])(
    'replaces %s with one mark per character a reader sees',
    (_label, text, drawn) => {
      expect(drawable(text)).toBe(drawn);
    },
  );

  it('composes an accent typed as two code points into the one letter the font has', () => {
    expect(drawable('café')).toBe('café');
  });

  it('turns a tab into a space and drops nothing else', () => {
    expect(drawable('a\tb')).toBe('a b');
  });
});
