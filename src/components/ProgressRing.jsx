/**
 * A completion ring.
 *
 * Two stacked circles with `stroke-dasharray` doing the arithmetic: the
 * track is the full circumference, the fill is `pct` of it. Rotated -90°
 * so zero starts at twelve o'clock rather than three.
 *
 * Purely decorative — the number it represents is always in the markup
 * beside it, so the svg is hidden from assistive tech.
 */
export default function ProgressRing({
  pct = 0,
  size = 44,
  stroke = 4,
  children,
  tone = 'brand',
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, pct));
  const dash = (clamped / 100) * circumference;

  return (
    <span className={`progress-ring tone-${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="progress-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        {/* A round cap on a zero-length arc still paints a dot, which
            reads as 1-2% rather than nothing. */}
        {dash > 0 && (
          <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      {children != null && <span className="progress-ring-label">{children}</span>}
    </span>
  );
}
