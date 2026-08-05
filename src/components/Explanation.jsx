import { useState } from 'react';
import CodeBody from './CodeBody';

export default function Explanation({
  content,
  answer,
  revealAnswer = true,
  highlight,
  theme = 'light',
}) {
  const [forceReveal, setForceReveal] = useState(false);
  const showAnswer = revealAnswer || forceReveal;

  return (
    <div className="explanation">
      {/* "Show explanation" is available before answering, and this line used
          to print the answer outright — one click and the question was over. */}
      {showAnswer ? (
        <p className="answer-badge">Answer: <strong>{answer}</strong></p>
      ) : (
        <button
          type="button"
          className="answer-reveal-btn"
          onClick={() => setForceReveal(true)}
        >
          Reveal the answer without attempting
        </button>
      )}
      <div className="explanation-content">
        <CodeBody content={content} highlight={highlight} theme={theme} />
      </div>
    </div>
  );
}
