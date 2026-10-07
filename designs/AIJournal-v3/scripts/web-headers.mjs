import {ancestorsAt,hasClass} from './html-structure.mjs';
// Keep the existing masthead and destinations together without changing their
// labels, controls or spacing. Numbered comps stay script-free and this is
// idempotent, including when a state is cloned from an already wrapped comp.
export function wrapWebHeaders(html,platform){
 if(platform==='desktop-web')return html;
 const pair=/<header\b[^>]*\bclass="[^\"]*\bmast\b[^\"]*"[^>]*>(?:(?!<\/header>)[\s\S])*<\/header>\s*<nav\b[^>]*\bclass="[^\"]*\bdest\b[^\"]*"[^>]*>(?:(?!<\/nav>)[\s\S])*<\/nav>/g;
 return html.replace(pair,(header,offset)=>{
  if(!hasClass(ancestorsAt(html,offset).at(-1)||{raw:''},'page'))return header;
  return `<div class="journal-header">\n${header}\n</div>`;
 });
}
