// Browser checks need Node 22+ and an installed browser, with no npm packages.
import fs from 'node:fs';
import path from 'node:path';

function executable(candidate){
 const directories=candidate.includes('/')||candidate.includes('\\')?['']:(process.env.PATH||'').split(path.delimiter);
 const extensions=process.platform==='win32'&&!path.extname(candidate)?(process.env.PATHEXT||'.EXE;.CMD').split(';'):[''];
 for(const directory of directories)for(const extension of extensions){
  const file=path.resolve(directory,candidate+extension);
  try{if(!fs.statSync(file).isFile())continue;fs.accessSync(file,process.platform==='win32'?fs.constants.F_OK:fs.constants.X_OK);return file;}catch{}
 }
 return null;
}

export function resolveBrowser(kind='chromium'){
 if(typeof WebSocket!=='function')throw Error('Browser verification requires Node.js 22 or later (built-in WebSocket).');
 const override=kind==='firefox'?process.env.FIREFOX_PATH:(process.env.CHROMIUM_PATH||process.env.EDGE_PATH);
 if(override){const result=executable(override);if(result)return result;throw Error(`Browser executable not found: ${override}. Set ${kind==='firefox'?'FIREFOX_PATH':'CHROMIUM_PATH'} to the executable path.`);}
 const winRoots=[process.env['ProgramFiles(x86)'],process.env.ProgramFiles,process.env.LOCALAPPDATA].filter(Boolean);
 const candidates=kind==='firefox'
  ? [...winRoots.map(base=>path.join(base,'Mozilla Firefox','firefox.exe')),'/Applications/Firefox.app/Contents/MacOS/firefox','firefox']
  : [...winRoots.flatMap(base=>[path.join(base,'Microsoft','Edge','Application','msedge.exe'),path.join(base,'Google','Chrome','Application','chrome.exe')]),'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium','microsoft-edge','microsoft-edge-stable','google-chrome','google-chrome-stable','chromium','chromium-browser'];
 for(const candidate of candidates){const result=executable(candidate);if(result)return result;}
 throw Error(`No ${kind==='firefox'?'Firefox':'Chromium browser'} found. Install ${kind==='firefox'?'Firefox':'Edge, Chrome or Chromium'}, or set ${kind==='firefox'?'FIREFOX_PATH':'CHROMIUM_PATH'} to its executable path.`);
}
