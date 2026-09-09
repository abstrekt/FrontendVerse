import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { getSyntaxStyle } from '../utils/syntaxTheme';
import MermaidDiagram from './MermaidDiagram';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('html', html);

function resolveLanguage(lang) {
  if (lang === 'js') return 'javascript';
  return lang;
}

export function headingToSlug(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[`*_[\]()#]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function CodeBody({ content, highlight, theme = 'light', onNavigate }) {
  const syntaxStyle = getSyntaxStyle(theme);

  return (
    <div className="code-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2({ children, ...props }) {
            const rawText = Array.isArray(children)
              ? children.map((c) => (typeof c === 'string' ? c : (c?.props?.children ?? ''))).join('')
              : String(children ?? '');
            const id = headingToSlug(rawText);
            return <h2 id={id} className="code-body-heading" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            const rawText = Array.isArray(children)
              ? children.map((c) => (typeof c === 'string' ? c : (c?.props?.children ?? ''))).join('')
              : String(children ?? '');
            const id = headingToSlug(rawText);
            return <h3 id={id} className="code-body-subheading" {...props}>{children}</h3>;
          },
          a({ href, children, ...props }) {
            const isInternal = typeof href === 'string' && href.startsWith('/');

            if (isInternal && onNavigate) {
              return (
                <a
                  href={href}
                  className="internal-link"
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                      return;
                    }
                    event.preventDefault();
                    onNavigate(href);
                  }}
                  {...props}
                >
                  {children}
                </a>
              );
            }

            if (isInternal) {
              return <a href={href} {...props}>{children}</a>;
            }

            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');

            if (match) {
              const language = resolveLanguage(match[1]);

              if (language === 'mermaid') {
                return <MermaidDiagram chart={codeStr} theme={theme} />;
              }

              return highlight ? (
                <SyntaxHighlighter
                  style={syntaxStyle}
                  language={language}
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
  );
}
