import CodeBody from './CodeBody';

export default function Explanation({ content, answer, highlight, theme = 'light' }) {
  return (
    <div className="explanation">
      <p className="answer-badge">Answer: <strong>{answer}</strong></p>
      <div className="explanation-content">
        <CodeBody content={content} highlight={highlight} theme={theme} />
      </div>
    </div>
  );
}
