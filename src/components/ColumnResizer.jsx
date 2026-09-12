import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A draggable seam between two shell columns.
 *
 * Sits on the column's trailing edge and reports the new width as the pointer
 * moves. The column itself is sized by a CSS custom property on `.layout`, so
 * a drag is one variable write per frame rather than a React re-render of the
 * whole shell — dragging a 250-node sidebar through a state update per
 * pointermove is visibly laggy. The committed value is lifted to React (and
 * persisted) only on pointerup.
 *
 * Exposed as a `separator` so it is not just a mouse affordance: arrow keys
 * nudge, Home resets to the default, and the value is announced.
 */

const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

export default function ColumnResizer({
  value,
  min,
  max,
  defaultValue,
  cssVar,
  onCommit,
  label,
  disabled = false,
}) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, width: 0 });
  const liveRef = useRef(value);

  const clamp = useCallback((n) => Math.round(Math.max(min, Math.min(max, n))), [min, max]);

  /** Writes straight to the DOM so a drag does not re-render the shell. */
  const paint = useCallback(
    (width) => {
      liveRef.current = width;
      document.documentElement.style.setProperty(cssVar, `${width}px`);
    },
    [cssVar]
  );

  // Keep the painted value in step when the width changes from elsewhere —
  // a reset, a viewport clamp, or restoring from storage.
  useEffect(() => {
    if (dragging) return;
    liveRef.current = value;
    document.documentElement.style.setProperty(cssVar, `${value}px`);
  }, [value, cssVar, dragging]);

  const onPointerDown = (event) => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    startRef.current = { x: event.clientX, width: value };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    paint(clamp(startRef.current.width + (event.clientX - startRef.current.x)));
  };

  const endDrag = (event) => {
    if (!dragging) return;
    setDragging(false);
    if (event?.pointerId !== undefined && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit(liveRef.current);
  };

  const onKeyDown = (event) => {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    let next = null;

    if (event.key === 'ArrowLeft') next = value - step;
    else if (event.key === 'ArrowRight') next = value + step;
    else if (event.key === 'Home') next = defaultValue;
    else if (event.key === 'End') next = max;
    else return;

    event.preventDefault();
    onCommit(clamp(next));
  };

  // The whole shell gets a grabbing cursor and stops selecting text mid-drag;
  // without this the pointer flickers as it crosses the columns underneath.
  useEffect(() => {
    if (!dragging) return undefined;
    document.body.classList.add('is-resizing-columns');
    return () => document.body.classList.remove('is-resizing-columns');
  }, [dragging]);

  return (
    <div
      className={`col-resizer${dragging ? ' is-dragging' : ''}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onCommit(defaultValue)}
      title={`${label} — drag, or double-click to reset`}
    >
      <span className="col-resizer-line" aria-hidden="true" />
    </div>
  );
}
