import { useEffect, useRef } from 'react';

/**
 * Keeps a ref pointing at the latest value so event handlers can read current
 * state without listing it as a dependency (which would churn their identity).
 *
 * Writing the ref in an effect rather than during render keeps this safe under
 * concurrent rendering, where a render may be thrown away before it commits.
 */
export function useLatestRef(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
