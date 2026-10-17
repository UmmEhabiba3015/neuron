import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

/*
 * ADR-020, decision 1: a query has to ask explicitly to see deleted entries.
 * TypeORM's two ways of asking are the withDeleted option and the restore
 * method. restore may not appear in src at all.
 *
 * withDeleted may appear in one file, audio-keys.repository.ts, whose two
 * reads answer with audio keys and never with an entry: the sweep at start
 * must keep a deleted memo's file, and deleting an account must remove it
 * (ADR-024). Anywhere else it is refused.
 *
 * softDelete is refused here as well. It would work, and it would write the
 * database's clock in the database's format into deleted_at.
 */
describe('the application source', () => {
  const SRC = join(__dirname, '..');

  const filesUnder = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);

      return entry.isDirectory() ? filesUnder(path) : [path];
    });

  const withoutComments = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  const sources = filesUnder(SRC)
    .filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'))
    .map((path) => ({
      path: relative(SRC, path),
      code: withoutComments(readFileSync(path, 'utf8')),
    }));

  it('is being read at all', () => {
    expect(sources.map(({ path }) => path)).toContain(
      'entries/entries.repository.ts',
    );
  });

  const using = (word: string): string[] =>
    sources
      .filter(({ code }) => new RegExp(`\\b${word}\\b`).test(code))
      .map(({ path }) => path);

  it.each(['softDelete', 'softRemove', 'restore', 'recover'])(
    'never uses %s',
    (word) => {
      expect(using(word)).toEqual([]);
    },
  );

  it('uses withDeleted only where audio keys are read for the files', () => {
    expect(using('withDeleted')).toEqual(['entries/audio-keys.repository.ts']);
  });
});
