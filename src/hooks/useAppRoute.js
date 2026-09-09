import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildRoute, parseRoute, LEARNING_SECTIONS } from '../utils/routes';

export function useAppRoute() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    function onPopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const route = useMemo(() => parseRoute(pathname), [pathname]);

  const navigate = useCallback((nextPath, { replace = false } = {}) => {
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    if (window.location.pathname === normalized) return;

    if (replace) {
      window.history.replaceState(null, '', normalized);
    } else {
      window.history.pushState(null, '', normalized);
    }

    setPathname(normalized);
  }, []);

  const setSection = useCallback(
    (section, { learningId = null, itemId = null, viewMode = 'quiz' } = {}) => {
      navigate(buildRoute({ section, viewMode, learningId, itemId }));
    },
    [navigate]
  );

  const setViewMode = useCallback(
    (viewMode) => {
      navigate(buildRoute({ section: 'mcq', viewMode }));
    },
    [navigate]
  );

  // One setter per learning section. These were nine hand-written copies of
  // the same three lines; the only thing that differed was the section name.
  // Memoised so the identity is stable and the route-repair effects that
  // depend on a setter don't re-run on every render.
  const learningSetters = useMemo(
    () =>
      Object.fromEntries(
        LEARNING_SECTIONS.map((section) => [
          section,
          (learningId, options) => navigate(buildRoute({ section, learningId }), options),
        ]),
      ),
    [navigate],
  );

  return {
    route,
    navigate,
    setSection,
    setViewMode,
    learningSetters,
  };
}
