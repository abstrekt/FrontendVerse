import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { getSyntaxStyle } from '../utils/syntaxTheme';

SyntaxHighlighter.registerLanguage('javascript', js);

export default function Explanation({ content, answer, highlight, theme = 'light' }) {
  const syntaxStyle = getSyntaxStyle(theme);

  return (
    <div className="explanation">
      <p className="answer-badge">Answer: <strong>{answer}</strong></p>
      <div className="explanation-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeStr = String(children).replace(/\n$/, '');

              if (match) {
                return highlight ? (
                  <SyntaxHighlighter
                    style={syntaxStyle}
                    language={match[1]}
                    PreTag="pre"
                    customStyle={{
                      background: 'var(--code-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                      margin: '10px 0',
                      fontSize: '0.83rem',
                      lineHeight: 1.55,
                    }}
                  >
                    {codeStr}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className}>{children}</code>
                );
              }

              return <code className={className} {...props}>{children}</code>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
