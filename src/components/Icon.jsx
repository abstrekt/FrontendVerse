/**
 * Inline SVG icons.
 *
 * Path data is taken from Lucide (https://lucide.dev), ISC licensed.
 * Copied rather than added as a dependency: twenty glyphs do not justify a
 * package, and inlining keeps them on `currentColor`, so every hover, active
 * and disabled rule already in index.css keeps working untouched.
 *
 * The svg is always aria-hidden. Icons here are decorative by construction —
 * any control using one must carry its own accessible name, either a visible
 * label, an aria-label, or an `.sr-only` span.
 */

const PATHS = {
  star: [
    'M11.5 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.1 2.1 0 0 0 1.6 1.16l5.16.75a.53.53 0 0 1 .3.91l-3.74 3.63a2.1 2.1 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.1 2.1 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.1 2.1 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.91l5.16-.75a2.1 2.1 0 0 0 1.6-1.16z',
  ],
  check: ['M20 6 9 17l-5-5'],
  clock: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M12 6v6l4 2'],
  search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'm21 21-4.3-4.3'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
  shuffle: [
    'M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22',
    'm18 2 4 4-4 4',
    'M2 6h1.9c1.5 0 2.9.9 3.6 2.2',
    'M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8',
    'm18 14 4 4-4 4',
  ],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9'],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41',
  ],
  monitor: [
    'M4 3h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M8 21h8',
    'M12 17v4',
  ],
  braces: [
    'M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1',
    'M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1',
  ],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  note: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M8 13h8',
    'M8 17h5',
  ],
  sliders: [
    'M21 4h-7',
    'M10 4H3',
    'M21 12h-9',
    'M8 12H3',
    'M21 20h-5',
    'M12 20H3',
    'M14 2v4',
    'M8 10v4',
    'M16 18v4',
  ],
};

export default function Icon({ name, size = 16, filled = false, className = '' }) {
  const paths = PATHS[name];
  if (!paths) return null;

  return (
    <svg
      className={`ico${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
