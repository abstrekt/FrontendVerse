import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildRoute, parseRoute } from '../utils/routes';

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
    (section, { learningId = null, viewMode = 'quiz' } = {}) => {
      navigate(buildRoute({ section, viewMode, learningId }));
    },
    [navigate]
  );

  const setViewMode = useCallback(
    (viewMode) => {
      navigate(buildRoute({ section: 'mcq', viewMode }));
    },
    [navigate]
  );

  const setLearningId = useCallback(
    (learningId, options) => {
      navigate(buildRoute({ section: 'learnings', learningId }), options);
    },
    [navigate]
  );

  const setReactLearningId = useCallback(
    (learningId, options) => {
      navigate(buildRoute({ section: 'react-learnings', learningId }), options);
    },
    [navigate]
  );

  const setHldLearningId = useCallback(
    (learningId, options) => {
      navigate(buildRoute({ section: 'hld', learningId }), options);
    },
    [navigate]
  );

  return {
    route,
    navigate,
    setSection,
    setViewMode,
    setLearningId,
    setReactLearningId,
    setHldLearningId,
  };
}
