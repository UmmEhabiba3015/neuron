// Normalize approved shared markup once, in the numbered source screens.
import fs from 'node:fs';
import {wrapWebHeaders} from './web-headers.mjs';
import {writingCompanion} from './writing-companion.mjs';
for(const platform of ['mobile-web','tablet-web','desktop-web']){
 const directory=new URL(`../${platform}/`,import.meta.url);
 for(const name of fs.readdirSync(directory).filter(n=>/^\d{2}-.*\.html$/.test(n)&&!n.startsWith('00-'))){
  const file=new URL(name,directory),source=fs.readFileSync(file,'utf8');
  const next=writingCompanion(wrapWebHeaders(source,platform));
  if(source!==next)fs.writeFileSync(file,next);
 }
}
