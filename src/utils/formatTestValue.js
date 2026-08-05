/**
 * Render an arbitrary runtime value for display in test results.
 *
 * Must never throw: it is handed whatever a user's solution returned, which can
 * be a function, a symbol, or a circular structure.
 */
export function formatTestValue(value) {
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return value.toString();
  if (typeof value === 'symbol') return value.toString();
  try {
    const json = JSON.stringify(value, null, 2);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}
