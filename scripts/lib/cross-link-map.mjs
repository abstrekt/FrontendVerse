/**
 * The cross-link dictionary: topic → the one entry that owns it.
 *
 * `apply-cross-links.mjs` links the first prose mention of each term to the
 * entry listed here. Two rules keep this table honest:
 *
 * - **One canonical owner per topic.** Several entries mention `useMemo`; only
 *   `react-guide/41` explains it, so that is where every mention points. When
 *   two entries could own a term, the one that teaches it wins over the one
 *   that applies it.
 * - **Terms must be unambiguous in prose.** `state`, `cache`, `grid` and `props`
 *   appear in a hundred sentences that are not about the entry, so they are not
 *   here. Multi-word phrases and proper nouns are what work.
 *
 * A term that turns out to link the wrong sense in practice should be deleted
 * from this table rather than worked around in the applier.
 */

export const TOPICS = [
  /* ── JavaScript language ─────────────────────────────────────────── */
  { section: 'learnings', id: 128, terms: ['event loop'] },
  { section: 'learnings', id: 130, terms: ['closures', 'closure'] },
  { section: 'learnings', id: 99, terms: ['hoisting'] },
  { section: 'learnings', id: 129, terms: ['execution context'] },
  { section: 'learnings', id: 100, terms: ['scope chain'] },
  { section: 'learnings', id: 123, terms: ['prototype chain', 'prototypal inheritance'] },
  { section: 'learnings', id: 106, terms: ['IIFE'] },
  { section: 'learnings', id: 153, terms: ['currying', 'partial application'] },
  { section: 'learnings', id: 111, terms: ['memoization'] },
  { section: 'learnings', id: 107, terms: ['higher-order functions', 'higher-order function'] },
  { section: 'learnings', id: 121, terms: ['async/await'] },
  { section: 'learnings', id: 3, terms: ['promise combinators'] },
  { section: 'learnings', id: 127, terms: ['Object.freeze'] },
  { section: 'learnings', id: 118, terms: ['spread operator', 'rest parameter'] },
  { section: 'learnings', id: 115, terms: ['destructuring'] },
  { section: 'learnings', id: 116, terms: ['ES6 modules'] },
  { section: 'learnings', id: 102, terms: ['strict mode'] },
  { section: 'learnings', id: 84, terms: ['falsy values'] },
  { section: 'learnings', id: 85, terms: ['wrapper objects'] },
  { section: 'learnings', id: 89, terms: ['strict equality', 'abstract equality'] },
  { section: 'learnings', id: 93, terms: ['implicit coercion', 'type coercion'] },
  { section: 'learnings', id: 145, terms: ['parallelism vs concurrency'] },

  /* ── Browser and web platform ────────────────────────────────────── */
  { section: 'browser', id: 152, terms: ['event delegation'] },
  { section: 'browser', id: 146, terms: ['event propagation', 'bubbling and capturing'] },
  { section: 'browser', id: 154, terms: ['critical rendering path'] },
  { section: 'browser', id: 155, terms: ['layout thrashing', 'forced synchronous layout'] },
  { section: 'browser', id: 157, terms: ['HTTP caching'] },
  { section: 'browser', id: 156, terms: ['CORS'] },
  { section: 'browser', id: 133, terms: ['web workers', 'web worker', 'structured clone'] },
  { section: 'browser', id: 158, terms: ['CSRF', 'XSS', 'JWT'] },
  { section: 'browser', id: 132, terms: ['localStorage', 'sessionStorage'] },
  { section: 'browser', id: 160, terms: ['TTFB', 'TLS handshake'] },
  { section: 'browser', id: 161, terms: ['head-of-line blocking', 'HTTP/2', 'HTTP/3'] },
  { section: 'browser', id: 162, terms: ['brotli', 'gzip'] },
  { section: 'browser', id: 122, terms: ['AJAX'] },
  { section: 'browser', id: 159, terms: ['API layer'] },
  {
    section: 'browser',
    id: 163,
    terms: ['Performance API', 'PerformanceObserver', 'Navigation Timing', 'Resource Timing', 'User Timing'],
  },

  /* ── Web fundamentals ────────────────────────────────────────────── */
  { section: 'web-fundamentals', id: 1, terms: ['render pipeline', 'preload scanner', 'CSSOM'] },
  { section: 'web-fundamentals', id: 2, terms: ['script loading'] },
  { section: 'web-fundamentals', id: 3, terms: ['resource hints', 'preconnect'] },
  { section: 'web-fundamentals', id: 5, terms: ['cascade layers'] },
  { section: 'web-fundamentals', id: 6, terms: ['web fonts', 'FOUT', 'FOIT', 'font-display'] },
  { section: 'web-fundamentals', id: 7, terms: ['srcset', 'responsive images'] },
  { section: 'web-fundamentals', id: 8, terms: ['CommonJS', 'ES modules'] },
  { section: 'web-fundamentals', id: 9, terms: ['bundler'] },
  { section: 'web-fundamentals', id: 10, terms: ['tree shaking', 'tree-shaking'] },
  { section: 'web-fundamentals', id: 11, terms: ['accessibility tree', 'semantic HTML'] },
  { section: 'web-fundamentals', id: 12, terms: ['FormData', 'constraint validation'] },
  { section: 'web-fundamentals', id: 13, terms: ['CSS grid', 'flexbox', 'container queries'] },
  { section: 'web-fundamentals', id: 14, terms: ['AbortController', 'AbortSignal'] },
  { section: 'web-fundamentals', id: 15, terms: ['service workers', 'service worker', 'app shell'] },
  { section: 'web-fundamentals', id: 16, terms: ['IndexedDB', 'BroadcastChannel', 'Cache Storage'] },

  /* ── CSS ─────────────────────────────────────────────────────────── */
  { section: 'css', id: 3, terms: ['CSS specificity', 'specificity'] },
  { section: 'css', id: 6, terms: ['reflow', 'repaint'] },
  { section: 'css', id: 2, terms: ['centering an element'] },
  { section: 'css', id: 5, terms: ['CSS units'] },

  /* ── System design ───────────────────────────────────────────────── */
  { section: 'system-design', id: 3, terms: ['RADIO framework'] },
  { section: 'system-design', id: 402, terms: ['Core Web Vitals'] },
  { section: 'system-design', id: 401, terms: ['long tasks', 'INP'] },
  { section: 'system-design', id: 403, terms: ['code splitting', 'bundle budget'] },
  { section: 'system-design', id: 405, terms: ['cache invalidation'] },
  { section: 'system-design', id: 407, terms: ['Content Security Policy', 'CSP'] },
  { section: 'system-design', id: 408, terms: ['silent refresh', 'refresh token'] },
  { section: 'system-design', id: 409, terms: ['internationalisation', 'internationalization'] },
  { section: 'system-design', id: 411, terms: ['optimistic updates'] },
  { section: 'system-design', id: 413, terms: ['feature flags'] },
  { section: 'system-design', id: 414, terms: ['monorepo'] },
  { section: 'system-design', id: 101, terms: ['rendering strategies'] },
  { section: 'system-design', id: 102, terms: ['GraphQL', 'BFF'] },
  {
    section: 'system-design',
    id: 105,
    terms: ['WebSocket', 'Server-Sent Events', 'long polling', 'WebTransport'],
  },
  { section: 'system-design', id: 106, terms: ['offline-first', 'background sync'] },
  { section: 'system-design', id: 107, terms: ['micro-frontends', 'micro-frontend'] },
  { section: 'system-design', id: 108, terms: ['design system'] },
  { section: 'system-design', id: 109, terms: ['deploy topology', 'stale-tab problem'] },
  { section: 'system-design', id: 111, terms: ['observability'] },
  { section: 'system-design', id: 112, terms: ['multi-stage build', 'Dockerfile', 'Docker'] },
  { section: 'system-design', id: 113, terms: ['Kubernetes', 'readiness probe'] },
  { section: 'system-design', id: 114, terms: ['blue-green', 'rolling update', 'canary'] },
  { section: 'system-design', id: 115, terms: ['origin shield', 'CDN'] },
  { section: 'system-design', id: 116, terms: ['edge functions', 'edge function'] },
  { section: 'system-design', id: 117, terms: ['webhooks', 'webhook'] },
  {
    section: 'system-design',
    id: 118,
    terms: ['cursor pagination', 'offset pagination', 'keyset pagination', 'pagination'],
  },
  { section: 'system-design', id: 8, terms: ['non-functional requirements', 'functional requirements'] },
  { section: 'system-design', id: 104, terms: ['state topology', 'server state'] },
  { section: 'system-design', id: 110, terms: ['white-labelling', 'multi-tenancy'] },
  { section: 'system-design', id: 404, terms: ['lazy loading'] },
  { section: 'system-design', id: 406, terms: ['WCAG', 'focus management', 'screen reader'] },
  { section: 'system-design', id: 410, terms: ['graceful degradation', 'exponential backoff'] },

  /* ── System design — the case studies and components that own a term ── */
  { section: 'system-design', id: 204, terms: ['CRDT', 'CRDTs'] },
  { section: 'system-design', id: 217, terms: ['resumable upload'] },
  { section: 'system-design', id: 219, terms: ['bufferbloat', 'loaded latency'] },
  { section: 'system-design', id: 300, terms: ['LLD round'] },
  { section: 'system-design', id: 301, terms: ['component API'] },
  { section: 'system-design', id: 302, terms: ['combobox'] },
  { section: 'system-design', id: 304, terms: ['focus trap'] },
  { section: 'system-design', id: 312, terms: ['normalized state'] },
  { section: 'system-design', id: 314, terms: ['log viewer', 'ring buffer'] },
  { section: 'system-design', id: 315, terms: ['metrics dashboard', 'downsampling'] },

  /* ── React ───────────────────────────────────────────────────────── */
  { section: 'react-guide', id: 15, terms: ['React.memo', 'reference trap'] },
  { section: 'react-guide', id: 41, terms: ['useMemo'] },
  { section: 'react-guide', id: 42, terms: ['useCallback'] },
  { section: 'react-guide', id: 40, terms: ['useEffect'] },
  { section: 'react-guide', id: 8, terms: ['useLayoutEffect'] },
  { section: 'react-guide', id: 10, terms: ['useRef'] },
  { section: 'react-guide', id: 11, terms: ['useReducer'] },
  { section: 'react-guide', id: 43, terms: ['useTransition'] },
  { section: 'react-guide', id: 44, terms: ['useDeferredValue'] },
  { section: 'react-guide', id: 45, terms: ['useId'] },
  { section: 'react-guide', id: 12, terms: ['Rules of Hooks'] },
  { section: 'react-guide', id: 7, terms: ['stale closure'] },
  { section: 'react-guide', id: 4, terms: ['reconciliation'] },
  { section: 'react-guide', id: 25, terms: ['error boundaries', 'error boundary'] },
  { section: 'react-guide', id: 24, terms: ['portals'] },
  { section: 'react-guide', id: 22, terms: ['controlled vs uncontrolled'] },
  { section: 'react-guide', id: 17, terms: ['Suspense'] },
  { section: 'react-guide', id: 16, terms: ['virtualization', 'virtualized list'] },
  { section: 'react-guide', id: 30, terms: ['Server Components'] },
  { section: 'react-guide', id: 31, terms: ['concurrent features'] },
  { section: 'react-guide', id: 33, terms: ['StrictMode'] },
  { section: 'react-guide', id: 19, terms: ['higher-order components'] },
  { section: 'react-guide', id: 20, terms: ['render props'] },
  { section: 'react-guide', id: 21, terms: ['compound components'] },
  { section: 'react-guide', id: 2, terms: ['fiber tree'] },
  { section: 'advanced-react', id: 2, terms: ['children as props'] },
  { section: 'advanced-react', id: 14, terms: ['request waterfall', 'request waterfalls'] },
  { section: 'advanced-react', id: 15, terms: ['out-of-order response'] },

  /* ── Algorithms ──────────────────────────────────────────────────── */
  { section: 'algorithm', id: 3, terms: ['two pointers'] },
  { section: 'algorithm', id: 4, terms: ['sliding window'] },
  { section: 'algorithm', id: 7, terms: ['binary search'] },
  { section: 'algorithm', id: 9, terms: ['depth-first search', 'breadth-first search'] },

  /* ── Coding challenges — the implementation, where one exists ────── */
  { section: 'coding', id: 13, terms: ['debounce', 'debouncing'] },
  { section: 'coding', id: 14, terms: ['throttle', 'throttling'] },
  { section: 'coding', id: 28, terms: ['LRU cache'] },
  { section: 'coding', id: 9, terms: ['deep clone', 'cloneDeep'] },

  /* ── AI-assisted development ─────────────────────────────────────── */
  { section: 'ai-dev', id: 3, terms: ['context engineering'] },
  { section: 'ai-dev', id: 6, terms: ['streaming UI', 'token streaming'] },
  { section: 'ai-dev', id: 7, terms: ['prompt injection', 'evals'] },
  { section: 'ai-dev', id: 9, terms: ['RAG', 'retrieval-augmented generation'] },
];
