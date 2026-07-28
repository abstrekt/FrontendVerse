export default function IncludeCompletedToggle({ checked, onChange }) {
  return (
    <>
      <label className="output-setting-toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="output-setting-toggle-label">Include completed questions</span>
      </label>
      <p className="output-setting-hint">
        {checked
          ? 'Completed questions stay in the random shuffle and show a badge.'
          : 'Only incomplete questions are shuffled.'}
      </p>
    </>
  );
}
