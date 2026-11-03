// The module scripts the prototypes and the website need (tools/modules/build.mjs wraps them the same
// way for dist/system.js): the registry runtime once, then each named module's script, registered with
// it. The registry is created once per page even where the website runs this payload again on a
// profile change; the scripts register again harmlessly.
import fs from 'node:fs';
import path from 'node:path';
import {loadConfig,discoverModules} from './system.mjs';
import {globalName} from './build.mjs';
export function moduleScripts(root,names){
 const cfg=loadConfig(root),g=globalName(cfg);
 const registry=fs.readFileSync(path.join(root,'tools','modules','runtime.js'),'utf8').replace('__GLOBAL__',g);
 let js=`if(!window.${g}){\n${registry}\n}\n`;
 for(const m of discoverModules(cfg).filter(x=>x.script&&names.includes(x.name)))js+=`(function (register) {\n'use strict';\n${fs.readFileSync(m.script,'utf8').trim()}\n})(window.${g}.register);\n`;
 return js;
}
