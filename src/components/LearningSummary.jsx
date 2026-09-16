import CodeBody from './CodeBody';

/* The plain-words card that opens every learning entry: what the thing is, the
   API you actually type, and one concrete example.

   It renders OUTSIDE the article element that select-to-highlight anchors
   against. Marks are stored as (text, nth-occurrence) pairs resolved within
   that element, so prose added inside it — but not passed through the marked
   CodeBody — would shift every stored index and silently move existing
   highlights. The trade is that the card itself is not highlightable. */
export default function LearningSummary({ summary, theme, onNavigate }) {
  if (!summary) return null;

  const { definition, api, useCase } = summary;
  if (!definition && !useCase) return null;

  // CodeBody so backticked identifiers pick up the same inline-code styling
  // they get in the body, rather than a second markdown path.
  const prose = (text) => <CodeBody content={text} theme={theme} onNavigate={onNavigate} />;

  return (
    <aside className="learning-summary">
      <span className="learning-summary-label">In plain words</span>

      {definition && <div className="learning-summary-definition">{prose(definition)}</div>}

      {api?.length > 0 && (
        <dl className="learning-summary-api">
          {api.map(({ signature, note }) => (
            <div key={signature}>
              <dt>
                <code>{signature}</code>
              </dt>
              <dd>{prose(note)}</dd>
            </div>
          ))}
        </dl>
      )}

      {useCase && (
        <div className="learning-summary-use-case">{prose(`**For example —** ${useCase}`)}</div>
      )}
    </aside>
  );
}
