export default function StarredFilterToggle({ checked, count, onChange, hint }) {
  return (
    <div className="starred-filter-block">
      <label className="output-setting-toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="output-setting-toggle-label">
          Starred only
          {count > 0 ? ` (${count})` : ''}
        </span>
      </label>
      {hint && <p className="output-setting-hint">{hint}</p>}
    </div>
  );
}
