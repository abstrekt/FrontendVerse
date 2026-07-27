import ReactMarkdown from 'react-markdown';

function InlineMd({ text }) {
  return (
    <ReactMarkdown
      allowedElements={['code', 'em', 'strong', 'a', 'del']}
      unwrapDisallowed
    >
      {text}
    </ReactMarkdown>
  );
}

export default function OptionList({ options, selected, answer, onPick }) {
  return (
    <div className="options-list">
      {options.map((opt) => {
        let className = 'option-btn';
        if (selected !== null) {
          if (opt.key === answer) {
            className += ' option-correct';
          } else if (opt.key === selected) {
            className += ' option-wrong';
          } else {
            className += ' option-dimmed';
          }
        }

        return (
          <button
            key={opt.key}
            className={className}
            disabled={selected !== null}
            onClick={() => onPick(opt.key)}
          >
            <span className="option-key">{opt.key}</span>
            <span className="option-text">
              <InlineMd text={opt.text} />
            </span>
            {selected === opt.key && opt.key === answer && (
              <span className="icon correct-icon">✓</span>
            )}
            {selected === opt.key && opt.key !== answer && (
              <span className="icon wrong-icon">✗</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
