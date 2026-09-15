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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useFocusTrap(panelRef, true, onClose);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((factor, origin) => {
    setScale((current) => {
      const next = clamp(current * factor, MIN_SCALE, MAX_SCALE);
      if (next === current) return current;
      if (origin) {
        // Keep the point under the cursor pinned while the scale changes.
        const ratio = next / current;
        setOffset((o) => ({
          x: origin.x - (origin.x - o.x) * ratio,
          y: origin.y - (origin.y - o.y) * ratio,
        }));
      }
      return next;
    });
  }, []);

  // Wheel has to be bound natively: React's onWheel is passive, so
  // preventDefault there does not stop the page/trackpad from scrolling.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    function onWheel(event) {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const origin = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      zoomBy(Math.exp(-event.deltaY * 0.002), origin);
    }

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomBy(1.25);
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomBy(0.8);
      } else if (event.key === '0') {
        event.preventDefault();
        reset();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [zoomBy, reset]);

  function onPointerDown(event) {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    drag.moved = true;
    setOffset({ x: drag.originX + dx, y: drag.originY + dy });
  }

  function onPointerUp(event) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.moved) return;
    // A click that did not drag, on the backdrop rather than the figure,
    // closes — the usual lightbox gesture.
    if (event.target === event.currentTarget) onClose();
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
          <span className="lightbox-scale">{Math.round(scale * 100)}%</span>
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
          onDoubleClick={() => (scale === 1 ? zoomBy(2) : reset())}
        >
          <div
            className="lightbox-stage"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        </div>

        <p className="lightbox-hint">Scroll to zoom · drag to pan · double-click to toggle · Esc to close</p>
      </div>
    </div>,
    document.body
  );
}
