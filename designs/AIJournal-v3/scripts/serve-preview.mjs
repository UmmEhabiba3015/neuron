// Optional loopback-only preview for module source files and microphone access.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.woff2':'font/woff2','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
export async function servePreview({root=project,port=8000}={}){
 root=fs.realpathSync(root);
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('Port must be an integer between 0 and 65535.');
 const server=http.createServer((request,response)=>{
  const fail=(status,text)=>{response.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});response.end(text);};
  if(!['GET','HEAD'].includes(request.method)){response.setHeader('Allow','GET, HEAD');return fail(405,'Use GET or HEAD.');}
  try{
   let pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   if(pathname.includes('\0')||pathname.includes('\\'))return fail(400,'Invalid path.');
   if(pathname==='/')pathname='/journal-website.html';
   let file=path.resolve(root,'.'+pathname);
   const inside=value=>value===root||value.startsWith(root+path.sep);
   if(!inside(file))return fail(403,'Outside the preview folder.');
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   file=fs.realpathSync(file);if(!inside(file))return fail(403,'Outside the preview folder.');
   const stat=fs.statSync(file);if(!stat.isFile())return fail(404,'File not found.');
   response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   if(request.method==='HEAD')return response.end();
   fs.createReadStream(file).on('error',()=>response.destroy()).pipe(response);
  }catch(error){fail(error instanceof URIError?400:404,'File not found.');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {server,url:`http://127.0.0.1:${server.address().port}`};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const flag=process.argv.slice(2).find(value=>value.startsWith('--port='));
  const {server,url}=await servePreview({port:flag?Number(flag.slice(7)):8000});
  console.log(`Open ${url}/ in your browser. Press Ctrl+C to stop. No data is stored or sent to an account.`);
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
 }catch(error){console.error(error.code==='EADDRINUSE'?'Port is in use. Run node scripts/serve-preview.mjs --port=8001':error.message);process.exitCode=1;}
}
