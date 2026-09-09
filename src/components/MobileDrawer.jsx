import { useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import Icon from './Icon';

/**
 * Slide-over container for the two side columns on narrow screens.
 *
 * Below the breakpoint these columns used to be `display: none`, which meant
 * filters, the article outline, tag cloud, weak-topic practice and every
 * per-section statistic were simply unreachable on a phone. The drawer gives
 * them somewhere to live.
 *
 * `side` mirrors the desktop position — the contextual panel comes from the
 * left, navigation from the right — so the spatial model carries over.
 */
export default function MobileDrawer({ open, side, title, id, onClose, children }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;

  const titleId = `${id}-title`;

  return (
    <div className="mobile-drawer-backdrop" onMouseDown={onClose}>
      <div
        className={`mobile-drawer mobile-drawer-${side}`}
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mobile-drawer-header">
          <h2 id={titleId} className="mobile-drawer-title">
            {title}
          </h2>
          <button type="button" className="mobile-drawer-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mobile-drawer-body">{children}</div>
      </div>
    </div>
  );
}
