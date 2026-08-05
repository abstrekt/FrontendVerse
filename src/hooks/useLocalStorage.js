import { useState, useEffect, useRef } from 'react';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reconcile a stored value against the shape we expect.
 *
 * Stored JSON is untrusted: it may predate a schema change, or be `null`
 * (which `JSON.parse` happily returns). Passing it through unchecked lets a
 * missing `stats` or `sessions` key crash the whole app on the next render,
 * with no way to clear storage from the UI.
 */
export function reconcileStored(stored, initialValue) {
  if (stored === null || stored === undefined) return initialValue;

  if (Array.isArray(initialValue)) {
    return Array.isArray(stored) ? stored : initialValue;
  }

  if (isPlainObject(initialValue)) {
    // Shallow-merge so keys added since the value was written get their default.
    return isPlainObject(stored) ? { ...initialValue, ...stored } : initialValue;
  }

  return typeof stored === typeof initialValue ? stored : initialValue;
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item === null ? initialValue : reconcileStored(JSON.parse(item), initialValue);
    } catch {
      return initialValue;
    }
  });

  // Skip the write on mount: it only ever rewrites what we just read, and on a
  // fresh install it fills storage with defaults before the user does anything.
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Quota exceeded or storage disabled. Report it once rather than failing
      // silently — the user's progress is not being saved.
      console.error(`Could not persist "${key}" to localStorage.`, err);
    }
  }, [key, value]);

  return [value, setValue];
}
