/**
 * Generate data/counts.json — the number of entries in each learning dataset.
 *
 * The sidebar shows "<completed>/<total>" for every section at once, but the
 * learning datasets are code-split and arrive after first paint. Without a
 * manifest the nav would render zeros and then jump. This is ~1KB, so it is
 * imported statically and the real numbers take over as each chunk lands.
 *
 * Run via `npm run build:data-manifest`; `npm test` verifies it is current.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'data', 'counts.json');

// Mirrors LEARNING_LOADERS in src/data/datasets.js.
const SECTIONS = {
  'acceldata-prep': ['data/acceldata-prep.json'],
  learnings: [
    'data/learnings.json',
    'data/tekion-interview-learnings.json',
    'data/wtfjs-learnings.json',
    'data/devto-interview-learnings.json',
    'data/senior-frontend-learnings.json',
  ],
  browser: ['data/browser-platform-learnings.json'],
  css: ['data/css-learnings.json'],
  'react-learnings': ['data/react-learnings.json'],
  'react-guide': ['data/react-guide.json'],
  'interview-prep': ['data/interview-prep.json'],
  'test-prep': ['data/test-prep.json'],
  'advanced-react': ['data/advanced-react.json'],
  'system-design': [
    'data/system-design-foundations.json',
    'data/system-design-hld.json',
    'data/system-design-cases.json',
    'data/system-design-lld.json',
    'data/system-design-deep-dives.json',
    'data/system-design-playbooks.json',
  ],
  algorithm: ['data/algorithm-learnings.json'],
  blind75: ['data/blind75-learnings.json'],
};

export function computeCounts() {
  const counts = {};
  for (const [section, files] of Object.entries(SECTIONS)) {
    counts[section] = files.reduce((total, file) => {
      const parsed = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
      return total + (parsed.learnings?.length ?? 0);
    }, 0);
  }
  return counts;
}

function main() {
  const counts = computeCounts();
  writeFileSync(OUT_PATH, `${JSON.stringify(counts, null, 2)}\n`);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Wrote data/counts.json — ${total} entries across ${Object.keys(counts).length} sections.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
