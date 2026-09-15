import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../hooks/useFocusTrap';
import Icon from './Icon';

const MIN_SCALE = 0.4;
const MAX_SCALE = 8;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * A figure blown up over the page, with wheel/pinch zoom and drag to pan.
 *
 * It takes `markup` — an HTML string snapshotted from the figure that opened
 * it — rather than the live nodes, so the original stays where it is and the
 * copy can be transformed freely. SVG ids in that snapshot are namespaced on
 * the way in: mermaid and the exported diagrams both reference markers and
 * gradients by `url(#id)`, and two elements sharing an id in one document
 * means the copy silently borrows the original's defs.
 */
export default function ImageLightbox({ markup, label, onClose }) {
  const panelRef = useRef(null);
  const viewportRef = useRef(null);
  // Scale and pan live in one state object. Zooming about a point needs both
  // in the same update, and a state updater has to stay pure — nudging the
  // other setter from inside one is exactly the kind of side effect React
  // replays, which made the zoom drift on its own.
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef(null);

  useFocusTrap(panelRef, true, onClose);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const reset = useCallback(() => setView({ scale: 1, x: 0, y: 0 }), []);

  const zoomBy = useCallback((factor, origin) => {
    setView((current) => {
      const scale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);
      if (scale === current.scale) return current;
      if (!origin) return { ...current, scale };
      // Keep the point under the cursor pinned while the scale changes.
      const ratio = scale / current.scale;
      return {
        scale,
        x: origin.x - (origin.x - current.x) * ratio,
        y: origin.y - (origin.y - current.y) * ratio,
      };
    });
  }, []);

  const panBy = useCallback((dx, dy) => {
    setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  }, []);

  // Coordinates relative to the viewport's centre, which is where the stage
  // scales from — so a zoom origin expressed this way pins that point.
  const originOf = useCallback((clientX, clientY) => {
    const rect = viewportRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
  }, []);

  /**
   * Figma's wheel contract, which is really the trackpad's:
   *   - two-finger swipe  → pan, in both axes
   *   - pinch             → the browser reports it as a wheel with ctrlKey
   *   - ⌘/ctrl + scroll   → zoom, the same gesture with a mouse
   *   - shift + scroll    → pan horizontally
   * There is deliberately no click-and-hold pan: on a mouse the wheel is
   * the pan, and holding the button down is not how the canvas moves.
   * Bound natively because React's onWheel is passive, so preventDefault
   * there would not stop the page scrolling behind the lightbox.
   */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    function onWheel(event) {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        // A trackpad pinch arrives as a stream of deltas around 1–10; one
        // mouse-wheel notch arrives as a single 100 (or 3 in line mode).
        // Normalising to lines and capping the step keeps both gestures at
        // the same speed instead of the wheel jumping 2.7x per click.
        const raw = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
        const step = Math.sign(raw) * Math.min(Math.abs(raw), 25);
        zoomBy(Math.exp(-step * 0.01), originOf(event.clientX, event.clientY));
        return;
      }

      const scrollScale = event.deltaMode === 1 ? 16 : 1;
      const [dx, dy] = event.shiftKey && event.deltaX === 0
        ? [event.deltaY, 0]
        : [event.deltaX, event.deltaY];
      panBy(-dx * scrollScale, -dy * scrollScale);
    }

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [zoomBy, panBy, originOf]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomBy(1.25);
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomBy(0.8);
      } else if (event.key === '0' || event.key === '1') {
        event.preventDefault();
        reset();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [zoomBy, reset]);

  // Touch: one finger pans, two fingers pinch to zoom while the midpoint
  // keeps panning — the same gesture as Figma on a tablet. Pointer events
  // give this for mouse, pen and touch through one code path.
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);

  function pinchState() {
    const points = [...pointersRef.current.values()];
    if (points.length < 2) return null;
    const [a, b] = points;
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      centerX: (a.x + b.x) / 2,
      centerY: (a.y + b.y) / 2,
    };
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    // Capture keeps a finger that slides off the figure still driving the
    // gesture. It throws if the pointer is already gone, which must not take
    // the rest of the gesture setup down with it.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* the gesture still works, it just stops at the viewport edge */
    }

    const pinch = pinchState();
    if (pinch) {
      pinchRef.current = pinch;
      dragRef.current = null;
      return;
    }

    // A held mouse button does not pan — panning is the two-finger gesture,
    // as on a Figma canvas. Touch and pen keep drag-to-pan because a
    // touchscreen has no scroll surface to two-finger on.
    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      totalMoved: 0,
      pan: event.pointerType !== 'mouse',
    };
  }

  function onPointerMove(event) {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const previous = pinchRef.current;
    if (previous) {
      const pinch = pinchState();
      if (!pinch || previous.distance === 0) return;
      pinchRef.current = pinch;
      panBy(pinch.centerX - previous.centerX, pinch.centerY - previous.centerY);
      zoomBy(pinch.distance / previous.distance, originOf(pinch.centerX, pinch.centerY));
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.totalMoved += Math.hypot(dx, dy);
    if (drag.pan) panBy(dx, dy);
  }

  function onPointerUp(event) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    const drag = dragRef.current;
    dragRef.current = null;
    // A click that never turned into a drag, landing on the empty space
    // around the figure rather than the figure itself, closes.
    if (drag && drag.totalMoved < 4 && event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div className="lightbox-backdrop">
      <div
        className="lightbox-panel"
        role="dialog"
        aria-modal="true"
        aria-label={label || 'Figure'}
        ref={panelRef}
      >
        <div className="lightbox-toolbar">
          <span className="lightbox-scale">{Math.round(view.scale * 100)}%</span>
          <button type="button" className="lightbox-btn" onClick={() => zoomBy(0.8)} aria-label="Zoom out">
            <Icon name="zoom-out" size={18} />
          </button>
          <button type="button" className="lightbox-btn" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
            <Icon name="zoom-in" size={18} />
          </button>
          <button type="button" className="lightbox-btn" onClick={reset} aria-label="Reset zoom">
            <Icon name="reset" size={18} />
          </button>
          <button type="button" className="lightbox-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div
          className="lightbox-viewport"
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => (view.scale === 1 ? zoomBy(2) : reset())}
        >
          <div
            className="lightbox-stage"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        </div>

        <p className="lightbox-hint">Two-finger scroll to pan · pinch or ⌘-scroll to zoom · 0 to reset · Esc to close</p>
      </div>
    </div>,
    document.body
  );
}
