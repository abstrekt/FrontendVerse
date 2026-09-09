import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AnnouncerContext = createContext(() => {});

/**
 * A single polite live region for app-wide status changes.
 *
 * Most of this app's feedback is visual only — switching section, narrowing a
 * filter, or clearing a search changes the list under you with nothing
 * announced. Component-local regions cover the quiz answer flow; this covers
 * everything that happens outside a question.
 */
export function AnnouncerProvider({ children }) {
  const [message, setMessage] = useState('');
  const debounceRef = useRef(null);
  const clearRef = useRef(null);

  const announce = useCallback((text) => {
    if (!text) return;
    clearTimeout(debounceRef.current);
    clearTimeout(clearRef.current);
    // Filters fire on every keystroke; announcing each one would talk over
    // the user. Settle first, then speak.
    debounceRef.current = setTimeout(() => {
      // Blanking first means an identical repeat still counts as a change and
      // gets re-announced.
      setMessage('');
      requestAnimationFrame(() => setMessage(text));
      clearRef.current = setTimeout(() => setMessage(''), 3000);
    }, 200);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(debounceRef.current);
      clearTimeout(clearRef.current);
    },
    [],
  );

  const value = useMemo(() => announce, [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce() {
  return useContext(AnnouncerContext);
}
