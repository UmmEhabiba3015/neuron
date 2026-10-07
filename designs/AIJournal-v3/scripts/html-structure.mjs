// Small traversal helper for authored HTML. Skip comments and raw-text contents;
// quoted '>' characters in attributes do not end a tag.
const voidTags=new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
export function* htmlTags(html){
 const re=/<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
 for(let m;m=re.exec(html);){
  if(!m[1])continue;
  const name=m[1].toLowerCase(),closing=m[0].startsWith('</');
  yield {start:m.index,end:re.lastIndex,name,closing,raw:m[0],void:voidTags.has(name)||/\/>$/.test(m[0])};
  if(!closing&&['script','style','textarea','title'].includes(name)){
   const end=new RegExp(`</${name}\\s*>`,'gi');end.lastIndex=re.lastIndex;
   const close=end.exec(html);if(!close)throw Error('Unclosed '+name);
   yield {start:close.index,end:end.lastIndex,name,closing:true,raw:close[0],void:false};
   re.lastIndex=end.lastIndex;
  }
 }
}
export function hasClass(tag,cls){return tag.raw.match(/\bclass="([^"]*)"/)?.[1].split(/\s+/).includes(cls)||false;}
export function elementRange(html,start){
 let first;const stack=[];
 for(const tag of htmlTags(html.slice(start))){
  if(!first){if(tag.start!==0||tag.closing)throw Error('Missing element at '+start);first=tag;if(tag.void)return {start,end:start+tag.end,html:html.slice(start,start+tag.end)};}
  if(tag.closing){
   const expected=stack.pop();if(expected!==tag.name)throw Error(`Misnested ${tag.name}; expected ${expected} at ${start+tag.start}`);
  }else if(!tag.void)stack.push(tag.name);
  if(!stack.length)return {start,end:start+tag.end,html:html.slice(start,start+tag.end)};
 }
 throw Error('Unclosed '+(first?.name||'element'));
}
export function elementsByClass(html,cls){
 const ranges=[];let end=0;
 for(const tag of htmlTags(html))if(!tag.closing&&tag.start>=end&&hasClass(tag,cls)){
  const range=elementRange(html,tag.start);ranges.push(range);end=range.end;
 }
 return ranges;
}
export function ancestorsAt(html,offset){
 const stack=[];
 for(const tag of htmlTags(html)){
  if(tag.start>=offset)break;
  if(tag.closing){const i=stack.findLastIndex(open=>open.name===tag.name);if(i>=0)stack.length=i;}
  else if(!tag.void)stack.push(tag);
 }
 return stack;
}
