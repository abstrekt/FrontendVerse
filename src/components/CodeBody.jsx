import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { getSyntaxStyle } from '../utils/syntaxTheme';
import MermaidDiagram from './MermaidDiagram';
import VisualTrace from './VisualTrace';
import InlineSvg from './InlineSvg';
import TexNotation from './TexNotation';

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

export default function CodeBody({ content, highlight, theme = 'dark', onNavigate }) {
  const syntaxStyle = getSyntaxStyle(theme);
  const isDark = theme === 'dark';

  return (
    <div className="code-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
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
          pre({ children }) {
            // A fenced block arrives as <pre><code>. The `code` handler below
            // returns the real element — a highlighter that emits its own
            // <pre>, or a trace/diagram component — so this wrapper would
            // either double-nest or trap the component in monospace,
            // non-wrapping text. Pass through and let `code` decide.
            return <>{children}</>;
          },
          p({ node, children, ...props }) {
            // Markdown wraps standalone images in a paragraph, but the
            // figure a diagram renders as is not legal inside <p> — the
            // parser closes the paragraph early and the DOM ends up
            // rearranged. Unwrap when the paragraph holds nothing but
            // images (blueprint 8 stacks two), so each figure becomes a
            // sibling instead.
            const kids = node?.children ?? [];
            const imageOnly =
              kids.length > 0 &&
              kids.every(
                (child) =>
                  child.tagName === 'img' ||
                  (child.type === 'text' && child.value.trim() === '')
              );
            if (imageOnly) return <>{children}</>;
            return <p {...props}>{children}</p>;
          },
          img({ src, alt, ...props }) {
            // Diagrams colour themselves from the app's CSS custom
            // properties, which only reach them when the SVG is part of this
            // document rather than an <img>'s isolated one.
            if (typeof src === 'string' && src.startsWith('/diagrams/') && src.endsWith('.svg')) {
              return <InlineSvg src={src} alt={alt} />;
            }
            return <img src={src} alt={alt} {...props} />;
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

            // remark-math marks `$…$` as `language-math`. It only rewrites
            // text nodes, so the template literals inside real code fences
            // (`${this.name}`) never reach here — which is why this goes
            // through the parser instead of a regex over the content.
            const cls = className || '';
            if (cls.includes('math-display')) {
              return <TexNotation tex={codeStr} display />;
            }
            if (cls.includes('language-math') || cls.includes('math-inline')) {
              return <TexNotation tex={codeStr} />;
            }

            if (match) {
              const language = resolveLanguage(match[1]);

              if (language === 'mermaid') {
                return <MermaidDiagram chart={codeStr} theme={theme} />;
              }

              if (language === 'trace') {
                return <VisualTrace source={codeStr} />;
              }

              return highlight ? (
                <SyntaxHighlighter
                  style={syntaxStyle}
                  language={language}
                  PreTag="pre"
                  customStyle={{
                    background: isDark ? '#22232a' : '#f7f7f8',
                    color: isDark ? '#f7f7f8' : '#0b0b0f',
                    border: isDark ? '1px solid #2e303a' : '1px solid #e5e5eb',
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
                <pre
                  className={`code-plain ${isDark ? 'code-plain-dark' : 'code-plain-light'}`}
                  style={{
                    background: isDark ? '#22232a' : '#f7f7f8',
                    color: isDark ? '#f7f7f8' : '#0b0b0f',
                    borderColor: isDark ? '#2e303a' : '#e5e5eb',
                  }}
                >
                  <code className={className}>{children}</code>
                </pre>
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
