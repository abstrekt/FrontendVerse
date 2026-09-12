import { useEffect, useState } from 'react';

/**
 * Renders a local SVG inline rather than through `<img src>`.
 *
 * The Blind 75 diagrams colour themselves from CSS custom properties
 * (`--dg-accent`, `--dg-surface`, …). An `<img>` is an isolated document, so
 * those properties never reach it and the diagram would be stuck on whichever
 * palette was baked in at export time — which is exactly how the previous
 * diagrams ended up as light-mode figures glaring on the dark theme.
 * Inlining puts the markup in the page, where the cascade applies and the
 * diagram follows the theme toggle like everything else.
 *
 * Only same-origin paths under `/diagrams/` are fetched, and the response is
 * required to actually be an SVG — these are build artefacts from this repo,
 * not user input, but the check keeps the trust boundary explicit.
 */

const cache = new Map();

function isAllowed(src) {
  return typeof src === 'string' && src.startsWith('/diagrams/') && src.endsWith('.svg');
}

async function load(src) {
  if (cache.has(src)) return cache.get(src);

  const promise = fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status}`);
      return res.text();
    })
    .then((body) => {
      if (!body.trimStart().startsWith('<svg')) throw new Error('not an svg');
      return body;
    })
    .catch((err) => {
      cache.delete(src);
      throw err;
    });

  cache.set(src, promise);
  return promise;
}

export default function InlineSvg({ src, alt = '', className = '' }) {
  const [markup, setMarkup] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isAllowed(src)) {
      setFailed(true);
      return undefined;
    }

    let live = true;
    setMarkup(null);
    setFailed(false);

    load(src).then(
      (body) => live && setMarkup(body),
      () => live && setFailed(true)
    );

    return () => {
      live = false;
    };
  }, [src]);

  // Falling back to <img> keeps the diagram visible if the fetch fails; it
  // just will not follow the theme.
  if (failed) return <img src={src} alt={alt} className={className} />;

  if (markup === null) {
    return <div className={`diagram-frame is-loading ${className}`.trim()} aria-hidden="true" />;
  }

  return (
    <figure className={`diagram-frame ${className}`.trim()}>
      <div
        className="diagram-svg"
        role="img"
        aria-label={alt || undefined}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </figure>
  );
}
