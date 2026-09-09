import { useEffect } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(QUERY).matches ? 'dark' : 'light';
}

/**
 * Keep the applied theme in step with the OS while the user is following it.
 *
 * The stored `quiz-theme` key alone cannot express this: it conflates "the
 * user picked dark" with "the OS happened to be dark the first time they
 * visited". `quiz-theme-source` separates the two, and only the `'system'`
 * source follows later OS changes.
 *
 * A CSS `@media (prefers-color-scheme)` block cannot do this job here — the
 * inline script in index.html always writes `data-theme`, so the attribute
 * selector would always win and the media query would be dead code.
 */
export function useSystemTheme(source, setTheme) {
  useEffect(() => {
    if (source !== 'system') return undefined;
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mql = window.matchMedia(QUERY);
    // Re-sync on subscribe: the OS may have changed while the user was
    // pinned to an explicit theme.
    setTheme(mql.matches ? 'dark' : 'light');

    const onChange = (event) => setTheme(event.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [source, setTheme]);
}
