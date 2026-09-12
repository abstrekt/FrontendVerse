/**
 * Whether questions already marked mastered stay in the shuffle.
 *
 * A switch rather than a checkbox: it changes what the app does from now
 * on rather than selecting a value to submit, and it lives in a stats
 * panel where a boxed checkbox row reads as another statistic.
 */
export default function IncludeCompletedToggle({ checked, onChange }) {
  return (
    <label className="switch-row">
      <span className="switch-row-label">Include mastered</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
    </label>
  );
}
