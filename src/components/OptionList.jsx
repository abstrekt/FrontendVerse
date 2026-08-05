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
  const isAnswered = selected !== null;

  return (
    <div className="options-list">
      {options.map((opt, index) => {
        const isCorrect = opt.key === answer;
        const isPicked = opt.key === selected;

        let className = 'option-btn';
        if (isAnswered) {
          if (isCorrect) className += ' option-correct';
          else if (isPicked) className += ' option-wrong';
          else className += ' option-dimmed';
        }

        return (
          <button
            key={opt.key}
            className={className}
            type="button"
            // aria-disabled rather than disabled: a disabled button leaves the
            // tab order, so a keyboard or screen-reader user could no longer
            // read back the options at the exact moment they want to.
            aria-disabled={isAnswered}
            onClick={() => !isAnswered && onPick(opt.key)}
          >
            <span className="option-key" aria-hidden="true">{opt.key}</span>
            <span className="sr-only">Option {index + 1}. </span>
            <span className="option-text">
              <InlineMd text={opt.text} />
            </span>
            {/* Correctness must not be signalled by colour alone: the correct
                option previously got a green background and nothing else
                unless you happened to have picked it. */}
            {isAnswered && isCorrect && (
              <span className="option-marker">
                <span className="icon correct-icon" aria-hidden="true">✓</span>
                <span className="sr-only">
                  {isPicked ? 'Correct, your answer' : 'Correct answer'}
                </span>
              </span>
            )}
            {isAnswered && isPicked && !isCorrect && (
              <span className="option-marker">
                <span className="icon wrong-icon" aria-hidden="true">✗</span>
                <span className="sr-only">Incorrect, your answer</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
