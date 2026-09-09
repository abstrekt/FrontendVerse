import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a media query.
 *
 * Used to decide whether the side columns render as columns or as a drawer.
 * That has to be a real render decision rather than a CSS `display: none`,
 * because the panel components own local state (search text, status filter)
 * and mounting two copies would let the two diverge.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
