// Embed the approved fallback assets and licenses; this build never downloads.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'assets','fonts');
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
const licenses=[...new Set(manifest.faces.map(face=>face.license))].map(file=>{
 const text=fs.readFileSync(path.join(directory,file),'utf8').replace(/\r\n?/g,'\n');
 if(text.includes('*/')||text.includes('</style>'))throw Error('Unsafe font license comment');
 return `/* ${file}\n${text.trim()}\n*/`;
});
export const portableFontCss=licenses.join('\n')+'\n'+manifest.faces.map(face=>{
 const data=fs.readFileSync(path.join(directory,face.file));
 if(data.toString('ascii',0,4)!=='wOF2')throw Error('Invalid WOFF2: '+face.file);
 if(crypto.createHash('sha256').update(data).digest('hex')!==face.sha256)throw Error('Font asset changed: '+face.file);
 return `@font-face{font-family:"${face.alias}";font-style:normal;font-weight:${face.weight};font-display:swap;src:url(data:font/woff2;base64,${data.toString('base64')}) format("woff2");unicode-range:${face.unicode}}`;
}).join('\n');
