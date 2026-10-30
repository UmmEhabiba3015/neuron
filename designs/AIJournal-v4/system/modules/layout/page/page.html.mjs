// page: <Page layout>{children}</Page> in the developers' code.
// data-layout and data-head are written only when they aren't the default.
// header, children, foot: the page's header section, its blocks and its composer, in that order. reader (pages
// round 5): on a walkthrough's navbar page, the label of the scrolling reader that holds the blocks between the
// pinned header and the composer ("<reader> content").
export default function render({ layout = 'single', head = 'title', scrolled = false, reader = '' } = {}, slots = {}, { html, attrs }) {
  const open = attrs({ 'data-layout': layout !== 'single' ? layout : false, 'data-head': head !== 'title' ? head : false, 'data-scrolled': scrolled });
  const { header = '', children = '', foot = '' } = slots;
  if (!reader) return html`<div class="aj-l-page"${open}>${header}${children}${foot}</div>`;
  return html`<div class="aj-l-page"${open}>
${header}
<div data-place="reader" tabindex="0" role="region" aria-label="${reader} content">
${children}
</div>${foot ? html`
${foot}` : ''}
</div>`;
}
