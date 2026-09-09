/**
 * Placeholder shown while a code-split dataset is in flight.
 *
 * Shaped like the article it replaces — title, a few paragraph lines, a code
 * block — so the content lands without shifting the layout under the reader.
 */
export default function Skeleton() {
  return (
    <div className="quiz-container learnings-view" aria-busy="true">
      <div className="skeleton-block">
        <p className="sr-only">Loading…</p>
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line" style={{ width: '92%' }} />
        <div className="skeleton-line" style={{ width: '78%' }} />
        <div className="skeleton-line" style={{ width: '85%' }} />
        <div className="skeleton-code" />
        <div className="skeleton-line" style={{ width: '70%' }} />
        <div className="skeleton-line" style={{ width: '88%' }} />
      </div>
    </div>
  );
}
