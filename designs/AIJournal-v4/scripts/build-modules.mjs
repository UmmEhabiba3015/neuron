// Build step: tokens, base and modules (system/) into dist/, ASSETS.md, DESIGN.md's token
// values, and the generated TOKENS, BASE and MODULES blocks of lock.css.
import { fileURLToPath } from 'node:url';
import { build } from '../tools/modules/build.mjs';
await build(fileURLToPath(new URL('..', import.meta.url)));
