// stage: <Stage platform chromeLabel statusTime captionTitle captionText>{shell}</Stage> in the developers' code.
// Never shipped: presentation furniture around a comp. Copied exactly from mobile-app/01-today.html.
const signal = '<svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'
  + '<svg viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M1.5 4.2a11 11 0 0 1 15 0"/><path d="M4.4 7a7 7 0 0 1 9.2 0"/><path d="M7.2 9.7a3 3 0 0 1 3.6 0"/></svg>'
  + '<svg viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="0.6" y="1.6" width="14" height="8.8" rx="2.2"/><rect x="2.2" y="3.2" width="9" height="5.6" rx="1.1" fill="currentColor" stroke="none"/><path d="M16.2 4.6v2.8" stroke-linecap="round"/></svg>';

export default function render({ platform = 'mobile', chromeLabel = '', statusTime = '', captionTitle = '', captionText = '' } = {}, slots, { html, raw, attrs }) {
  const p = platform;   // always written: modules read it as a context (data-platform)
  const ios = platform === 'ios';
  const chrome = ios
    ? html`<div class="aj-l-stage__chrome"${attrs({ 'data-platform': p })} aria-hidden="true"><span>${statusTime}</span><span class="aj-l-stage__signal">${raw(signal)}</span></div>`
    : html`<div class="aj-l-stage__chrome"${attrs({ 'data-platform': p })} aria-hidden="true"><span>${chromeLabel}</span></div>`;
  const homebar = ios ? html`<span class="aj-l-stage__homebar" aria-hidden="true"></span>` : '';
  const caption = captionTitle || captionText
    ? html`<p class="aj-l-stage__caption"${attrs({ 'data-platform': p })}><b>${captionTitle}</b><br>${captionText}</p>`
    : '';
  return html`<div class="aj-l-stage"${attrs({ 'data-platform': p })}>${chrome}${slots.children}${homebar}</div>${caption}`;
}
