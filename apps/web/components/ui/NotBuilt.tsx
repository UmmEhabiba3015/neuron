'use client';

import { useNotBuilt } from '@/hooks/useNotBuilt';
import { NOT_BUILT_YET, type UnbuiltName } from '@/lib/unbuilt';

/*
 * The pieces drawn for a control that does not work yet. Which control it
 * is, and whether it was pressed, comes from the useNotBuilt hook.
 */

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
