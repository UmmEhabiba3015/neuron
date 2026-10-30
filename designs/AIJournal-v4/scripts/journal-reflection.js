// The app's coordinator for Reflections (v4 C3; the walkthroughs and the website). The booklet turns its own leaves
// (booklet.js); this does what leaves the booklet:
//   a note's "N entries" (data-days) -> Timeline: the link opens the Timeline screen as any link does, then the
//     screen's record takes the days as its data-jump, so it lands on them with its wash and frame (one frame round
//     each run of neighbouring days). Timeline's Reflections destination becomes the way back: it wears the back
//     chevron (from the build-time template timeline-back, the back module) and points at the screen the leaf was on,
//     so the masthead and navbar never move; it is a plain destination again when Timeline is left. Back on
//     Reflections the booklet is on the leaf it left: the screens stay in the page. The developers' app reopens it
//     by #leaf-<id>.
//   an in-screen link (#earlier: the trend's source, the signed leaf's Earlier weeks) -> scrolls within its screen,
//     since a hash names a screen here.
window.createJournalReflection=function({signal}){
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches&&document.documentElement.dataset.motionReview!=='play';
 const template=name=>document.querySelector(`template[data-template="${name}"]`)?.content.firstElementChild.cloneNode(true);
 let pending=null,back=null;
 const leave=()=>{if(!back)return;back.tab.setAttribute('href',back.href);back.chevron.remove();back=null;};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button||event.metaKey||event.ctrlKey||event.shiftKey)return;
  const screen=link.closest('.screen'),href=link.getAttribute('href');
  if(!screen||!href.includes('#'))return;
  if(link.dataset.days){
   const route=href.split('#')[1],tab=document.getElementById(route)?.querySelector('.aj-c-dest a[href$="#reflections"]');
   pending={route,days:link.dataset.days};
   leave();
   const chevron=tab&&template('timeline-back')?.querySelector('svg');
   if(chevron){
    chevron.classList.add('aj-c-dest__back');tab.prepend(chevron);
    back={tab,chevron,route,href:tab.getAttribute('href')};tab.setAttribute('href',`#${screen.id}`);
   }
   return;
  }
  const target=href.startsWith('#')&&document.getElementById(href.slice(1));
  if(!target||target.classList.contains('screen')||!screen.contains(target))return;
  event.preventDefault();
  target.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});
  if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
  target.focus({preventScroll:true});
 },{signal});
 addEventListener('hashchange',()=>{
  const asked=pending,route=location.hash.slice(1);pending=null;
  if(back&&route!==back.route)leave();
  if(!asked||route!==asked.route)return;
  const record=document.getElementById(asked.route)?.querySelector('[data-module~="record"]');
  // after the screen is on show and the navbar has placed its reader
  if(record)requestAnimationFrame(()=>requestAnimationFrame(()=>{record.dataset.jump=asked.days;}));
 },{signal});
};
