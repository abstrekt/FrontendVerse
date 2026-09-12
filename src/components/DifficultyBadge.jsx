import { DIFFICULTY_LABELS } from '../utils/progress';

/**
 * `compact` drops to a single letter (E/M/H). On a one-line list row
 * the full word costs more horizontal room than the title can spare,
 * and the colour is already carrying the meaning — so the letter is a
 * disambiguator for the colour, not the label. The full word stays in
 * the accessible name either way.
 */
export default function DifficultyBadge({ difficulty, compact = false }) {
  if (!difficulty) return null;

  const label = DIFFICULTY_LABELS[difficulty] ?? difficulty;

  if (compact) {
    return (
      <span
        className={`difficulty-dot difficulty-${difficulty}`}
        title={label}
        aria-label={label}
      >
        <span aria-hidden="true">{label.charAt(0)}</span>
      </span>
    );
  }

  return <span className={`difficulty-badge difficulty-${difficulty}`}>{label}</span>;
}
