// Area 4 (composer): composer-input, memo-draft-line.
// name -> render => markup (tools/modules/templates.mjs; files load in name order).
export default {
  // The prototype's text field: it replaces the screens' placeholder field when the runtime sets a composer
  // up. The field module renders it, with the composer's hook (input) on its root; the runtime adds the
  // app's own class (prototype-input), which the prototype's tests select.
  'composer-input': render => render('field', { tag: 'textarea', label: 'Add to today' }, {}, { 'data-hook': 'input', rows: '1', placeholder: 'Add to today' }),
  // v4 C5: the voice memo draft line, which the runtime puts under a composer's row while a draft exists (pending's
  // draft form, the composer's span place). The runtime writes its length (hook length) and its name.
  'memo-draft-line': render => render('pending', { form: 'draft', text: 'Voice memo draft', length: '0:00', action: 'Continue', label: 'Continue your voice memo draft' }, {}, { 'data-hook': 'draft', 'data-place': 'span' }),
};
