import { useCallback, useRef, useState } from 'react';
import ImageLightbox from './ImageLightbox';
import Icon from './Icon';

let uid = 0;

/**
 * Namespace every id in a snapshot so the copy in the lightbox does not
 * collide with the figure still on the page. Mermaid arrowheads and the
 * exported diagrams' gradients are both `url(#id)` references, and the
 * browser resolves those to whichever element with that id comes first.
 */
function namespaceIds(markup) {
  const suffix = `-lb${(uid += 1)}`;
  return markup
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}${suffix}"`)
    .replace(/url\((['"]?)#([^)'"]+)\1\)/g, (_, q, id) => `url(${q}#${id}${suffix}${q})`)
    .replace(/\b(xlink:href|href)="#([^"]+)"/g, (_, attr, id) => `${attr}="#${id}${suffix}"`);
}

/**
 * Wraps a figure so it can be opened full screen: double-click anywhere on
 * it, or hit the expand button that fades in on hover/focus.
 *
 * The lightbox is handed a snapshot of the rendered DOM rather than the
 * source, which is what lets one wrapper serve inlined SVG diagrams, mermaid
 * charts and plain `<img>` alike — whatever ends up inside is what gets
 * blown up.
 */
export default function ZoomableFigure({ label = '', className = '', children }) {
  const hostRef = useRef(null);
  const [markup, setMarkup] = useState(null);

  const open = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const inner = host.innerHTML;
    if (inner) setMarkup(namespaceIds(inner));
  }, []);

  return (
    <div className={`zoomable${className ? ` ${className}` : ''}`}>
      <div
        className="zoomable-body"
        ref={hostRef}
        onDoubleClick={open}
        title="Double-click to view full screen"
      >
        {children}
      </div>

      <button
        type="button"
        className="zoomable-expand"
        onClick={open}
        aria-label={label ? `View full screen: ${label}` : 'View full screen'}
      >
        <Icon name="expand" size={15} />
      </button>

      {markup !== null && (
        <ImageLightbox markup={markup} label={label} onClose={() => setMarkup(null)} />
      )}
    </div>
  );
}
