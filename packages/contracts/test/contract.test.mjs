import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import * as contract from '../src/index.ts';

/*
 * Two rules from ADR-019 that nothing else enforces.
 *
 *   1. The package imports nothing, and holds facts rather than behaviour.
 *   2. A fact that is in the package is not also written out by hand in
 *      either application.
 *
 * This file is the one place in the package that imports anything. It is a
 * check on the contract and not part of it, which is why it is outside src.
 */
const PACKAGE = join(import.meta.dirname, '..');
const REPOSITORY = join(PACKAGE, '..', '..');

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const contractFiles = filesUnder(join(PACKAGE, 'src')).map((path) => ({
  path: relative(REPOSITORY, path),
  code: withoutComments(readFileSync(path, 'utf8')),
}));

test('the package depends on no other package', () => {
  const manifest = JSON.parse(
    readFileSync(join(PACKAGE, 'package.json'), 'utf8'),
  );

  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    assert.equal(manifest[field], undefined, `package.json has ${field}`);
  }
});

test('no file of the contract imports anything', () => {
  const importing = [
    /^\s*import\s/m,
    /\bimport\s*\(/,
    /\brequire\s*\(/,
    /^\s*export\s[^;]*\sfrom\s/m,
  ];

  for (const { path, code } of contractFiles) {
    for (const pattern of importing) {
      assert.doesNotMatch(code, pattern, `${path} imports something`);
    }
  }
});

test('the contract holds facts, and no function or class', () => {
  for (const { path, code } of contractFiles) {
    assert.doesNotMatch(code, /\bfunction\b|=>|\bclass\b/, path);
  }

  for (const [name, value] of Object.entries(contract)) {
    assert.notEqual(typeof value, 'function', `${name} is a function`);
  }
});

/*
 * The source of both applications, as a person wrote it.
 *
 * Tests are left out on purpose. A test that says "a limit of 200 is
 * accepted and 201 is refused" is an independent statement of what the
 * product should do, and it is what fails when the contract's number is
 * changed by mistake. Migrations are left out because each one records the
 * schema as it was on the day it was written.
 */
const applicationSource = ['apps/api/src', 'apps/web/app', 'apps/web/lib']
  .flatMap((directory) => filesUnder(join(REPOSITORY, directory)))
  .filter((path) => /\.tsx?$/.test(path))
  .filter((path) => !/\.(spec|test)\.tsx?$/.test(path))
  .filter((path) => !path.includes('/migrations/'))
  .map((path) => ({
    path: relative(REPOSITORY, path),
    source: readFileSync(path, 'utf8'),
  }));

test('the mood words are not written out again in either application', () => {
  /*
   * One mood word in quotes is an ordinary use of a value, and the compiler
   * checks it against the contract's type. Two of them side by side, in a
   * list or in a union, is a second copy of the list.
   */
  const word = `['"\`](?:${contract.MOODS.join('|')})['"\`]`;
  const twoInARow = new RegExp(`${word}\\s*[,|]\\s*${word}`);

  const copies = applicationSource
    .filter(({ source }) => twoInARow.test(source))
    .map(({ path }) => path);

  assert.deepEqual(copies, []);
});

/*
 * A bare 8 or 200 means nothing: 200 is also an HTTP status, and 8 is a
 * great many things. So a number counts as a copy only when it stands on a
 * line that also says what it is a number of.
 */
function linesThatRestate(value, subject) {
  const number = new RegExp(`(?<![\\w.])${value}(?![\\w.])`);

  return applicationSource.flatMap(({ path, source }) =>
    source
      .split('\n')
      .map((line, index) => ({ line, where: `${path}:${index + 1}` }))
      .filter(({ line }) => number.test(line) && subject.test(line))
      .map(({ line, where }) => `${where}  ${line.trim()}`),
  );
}

test('the page sizes are not written as numbers in either application', () => {
  const aboutPaging = /page|limit|offset|@Max\b/i;

  assert.deepEqual(linesThatRestate(contract.MAX_PAGE_SIZE, aboutPaging), []);
  assert.deepEqual(
    linesThatRestate(contract.DEFAULT_PAGE_SIZE, aboutPaging),
    [],
  );
});

test('the password minimum is not written as a number in either application', () => {
  const aboutPasswords = /password|characters|MinLength|minimum/i;

  assert.deepEqual(
    linesThatRestate(contract.PASSWORD_MIN_LENGTH, aboutPasswords),
    [],
  );
});
