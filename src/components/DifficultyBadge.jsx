import { DIFFICULTY_LABELS } from '../utils/progress';

export default function DifficultyBadge({ difficulty }) {
  if (!difficulty) return null;

  const label = DIFFICULTY_LABELS[difficulty] ?? difficulty;

  return (
    <span className={`difficulty-badge difficulty-${difficulty}`}>
      {label}
    </span>
  );
}
