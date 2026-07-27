import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import { getSyntaxStyle } from '../utils/syntaxTheme';

SyntaxHighlighter.registerLanguage('javascript', js);

export default function CodeBody({ content, highlight, theme = 'light' }) {
  const syntaxStyle = getSyntaxStyle(theme);

  return (
    <div className="code-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return highlight ? (
                <SyntaxHighlighter
                  style={syntaxStyle}
                  language={match[1]}
                  PreTag="pre"
                  customStyle={{
                    background: 'var(--code-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    margin: 0,
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                  }}
                >
                  {codeStr}
                </SyntaxHighlighter>
              ) : (
                <pre><code className={className}>{children}</code></pre>
              );
            }

            if (!inline && !match) {
              return <pre><code {...props}>{children}</code></pre>;
            }

            return <code>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
