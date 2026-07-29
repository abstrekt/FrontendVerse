import { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;

function initMermaid(theme) {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'dark' ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      wrappingWidth: 300,
    },
    sequence: {
      useMaxWidth: true,
    },
  });
  mermaidInitialized = true;
}

export default function MermaidDiagram({ chart, theme = 'light' }) {
  const containerRef = useRef(null);
  const renderId = useId().replace(/:/g, '');

  useEffect(() => {
    if (!mermaidInitialized) {
      initMermaid(theme);
    } else {
      initMermaid(theme);
    }

    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;
      try {
        const { svg } = await mermaid.render(`mermaid-${renderId}`, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // useMaxWidth scales the SVG but can leave foreignObject narrower than label divs
          containerRef.current.querySelectorAll('foreignObject').forEach((fo) => {
            const label = fo.querySelector('div');
            if (!label) return;
            const width = Math.ceil(label.scrollWidth);
            const height = Math.ceil(label.scrollHeight);
            if (width > 0) fo.setAttribute('width', String(width));
            if (height > 0) fo.setAttribute('height', String(height));
          });
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.textContent = chart;
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, theme, renderId]);

  return <div className="mermaid-diagram" ref={containerRef} />;
}
