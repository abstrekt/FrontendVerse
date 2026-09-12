import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Persisted widths for the two resizable shell columns.
 *
 * The upper bounds are a share of the viewport rather than fixed pixels: a
 * 420px nav rail is comfortable on a 27" display and absurd on a 1280px
 * laptop, and the stored width has to survive moving between the two. So the
 * bounds are recomputed on resize and a stored width that no longer fits is
 * clamped down — without overwriting what was saved, so widening the window
 * restores the width the user actually chose.
 */

export const COLUMN_DEFAULTS = { nav: 248, panel: 300 };

const LIMITS = {
  // min: below this the labels truncate to uselessness.
  // maxPx / maxRatio: whichever is smaller wins.
  nav: { min: 180, maxPx: 420, maxRatio: 0.26 },
  panel: { min: 220, maxPx: 560, maxRatio: 0.4 },
};

function boundsFor(key, viewportWidth) {
  const { min, maxPx, maxRatio } = LIMITS[key];
  // On a narrow window the ratio can fall under the minimum; the minimum
  // wins, and the column simply takes a bigger share.
  return { min, max: Math.max(min, Math.min(maxPx, Math.round(viewportWidth * maxRatio))) };
}

export function useColumnWidths() {
  const [stored, setStored] = useLocalStorage('layout-column-widths', COLUMN_DEFAULTS);

  const [viewport, setViewport] = useState(
    () => (typeof window === 'undefined' ? 1440 : window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => setViewport(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const bounds = useMemo(
    () => ({ nav: boundsFor('nav', viewport), panel: boundsFor('panel', viewport) }),
    [viewport]
  );

  const widths = useMemo(() => {
    const clamp = (key) => {
      const { min, max } = bounds[key];
      const raw = stored?.[key] ?? COLUMN_DEFAULTS[key];
      return Math.round(Math.max(min, Math.min(max, raw)));
    };
    return { nav: clamp('nav'), panel: clamp('panel') };
  }, [stored, bounds]);

  const setWidth = useCallback(
    (key, next) => setStored((prev) => ({ ...COLUMN_DEFAULTS, ...prev, [key]: Math.round(next) })),
    [setStored]
  );

  const reset = useCallback(() => setStored(COLUMN_DEFAULTS), [setStored]);

  return { widths, bounds, setWidth, reset };
}
