/**
 * Percentage of a pass completed, clamped to 0–100.
 *
 * The clamp is load-bearing: if the queue ever reports more remaining than the
 * pass holds, the raw expression goes negative and the bar renders at
 * `width: -100%`.
 */
export function clampPct(sessionTotal, remaining) {
  if (!(sessionTotal > 0)) return 0;
  const pct = ((sessionTotal - remaining) / sessionTotal) * 100;
  return Math.min(100, Math.max(0, pct));
}
