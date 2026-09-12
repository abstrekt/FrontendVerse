import Icon from './Icon';

/**
 * "Starred only" as a pressable chip rather than a checkbox plus a
 * sentence of hint text. It sits in a panel toolbar next to the other
 * filters, where a two-line explanation of what a star means would
 * outweigh every control around it.
 */
export default function StarredFilterToggle({ checked, count = 0, onChange, hint }) {
  return (
    <button
      type="button"
      className={`toggle-chip${checked ? ' active' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      title={hint || 'Show starred items only'}
    >
      <Icon name="star" size={13} filled={checked} />
      <span>Starred</span>
      {count > 0 && <span className="toggle-chip-count">{count}</span>}
    </button>
  );
}
