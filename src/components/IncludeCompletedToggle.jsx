export default function IncludeCompletedToggle({ checked, onChange }) {
  return (
    <>
      <label className="output-setting-toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="output-setting-toggle-label">Include mastered questions</span>
      </label>
      <p className="output-setting-hint">
        {checked
          ? 'Mastered questions stay in the shuffle and keep their badge.'
          : 'Only questions that are not mastered are shuffled.'}
      </p>
    </>
  );
}
