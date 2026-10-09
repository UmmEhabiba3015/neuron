'use client';

import { useState } from 'react';
import { NOT_BUILT_YET, UNBUILT, type UnbuiltName } from '@/lib/unbuilt';

/*
 * A control that is drawn and does not work yet takes its name from
 * lib/unbuilt.ts, and so does this hook. A press shows the one sentence and
 * does nothing else: no request is sent.
 *
 * Each such control on screen carries `data-unbuilt` with its name in the
 * list, so all of them can be found in a browser with one selector.
 */
export function useNotBuilt(name: UnbuiltName) {
  const [said, setSaid] = useState(false);

  return {
    label: UNBUILT[name].label,
    said,
    press: () => setSaid(true),
    marker: { 'data-unbuilt': name },
  };
}

/* The sentence beside a control that was pressed. */
export function NotBuiltYet({ className }: { className: string }) {
  return (
    <p className={className} role="status">
      {NOT_BUILT_YET}
    </p>
  );
}

/*
 * A part of a screen with no data behind it yet. The sentence stands where
 * its rows would be. No sample rows are drawn.
 *
 * `span` is for a place inside a line, such as the explanation under the
 * name of a settings row, where a paragraph is not allowed.
 */
export function NotBuiltInPlace({
  name,
  className,
  span,
}: {
  name: UnbuiltName;
  className: string;
  span?: boolean;
}) {
  const Tag = span ? 'span' : 'p';

  return (
    <Tag className={className} data-unbuilt={name}>
      {NOT_BUILT_YET}
    </Tag>
  );
}

/*
 * A row of a settings sheet that leads to a feature not built yet. It is a
 * button and not a link, because it goes nowhere. live.css 5.5 makes a
 * button look like the designer's row.
 */
export function NotBuiltRow({
  name,
  why,
  value,
}: {
  name: UnbuiltName;
  why: string;
  value?: string;
}) {
  const control = useNotBuilt(name);

  return (
    <>
      <button
        className="srowlink"
        type="button"
        onClick={control.press}
        {...control.marker}
      >
        <span className="lab">
          {control.label}
          <span className="why">{why}</span>
        </span>
        {value ? <span className="val">{value}</span> : null}
      </button>
      {control.said ? <NotBuiltYet className="auth-help state-message" /> : null}
    </>
  );
}
