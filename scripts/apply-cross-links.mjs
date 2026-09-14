/**
 * Links the first prose mention of a known topic to the entry that owns it.
 *
 *   node scripts/apply-cross-links.mjs            # write
 *   node scripts/apply-cross-links.mjs --check    # CI guard, writes nothing
 *   node scripts/apply-cross-links.mjs --dry      # report what would change
 *
 * The dictionary is `lib/cross-link-map.mjs`; this file is only the machinery.
 *
 * An article that says "the bundle grew because tree shaking failed" should let
 * the reader get to the tree-shaking entry, and doing that by hand across ~460
 * entries is both a day of work and immediately out of date. Hence a pass that
 * is idempotent and checked in CI.
 *
 * What it will not touch, because a link there is either broken markup or
 * noise: fenced code, inline code, headings, image alt text, existing links,
 * math, raw HTML, and the entry that owns the topic itself. At most
 * `MAX_LINKS_PER_ENTRY` are added to one entry — an article where every other
 * noun is blue is worse than one with no links at all.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { TOPICS } from './lib/cross-link-map.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/** The learning sections. MCQ/coding/output explanations are deliberately out. */
const CONTENT_FILES = [
  { file: 'data/learnings.json', section: 'learnings' },
  { file: 'data/tekion-interview-learnings.json', section: 'learnings' },
  { file: 'data/wtfjs-learnings.json', section: 'learnings' },
  { file: 'data/devto-interview-learnings.json', section: 'learnings' },
  { file: 'data/senior-frontend-learnings.json', section: 'learnings' },
  { file: 'data/browser-platform-learnings.json', section: 'browser' },
  { file: 'data/css-learnings.json', section: 'css' },
  { file: 'data/web-fundamentals.json', section: 'web-fundamentals' },
  { file: 'data/ai-assisted-development.json', section: 'ai-dev' },
  { file: 'data/system-design-foundations.json', section: 'system-design' },
  { file: 'data/system-design-hld.json', section: 'system-design' },
  { file: 'data/system-design-cases.json', section: 'system-design' },
  { file: 'data/system-design-lld.json', section: 'system-design' },
  { file: 'data/system-design-deep-dives.json', section: 'system-design' },
  { file: 'data/system-design-playbooks.json', section: 'system-design' },
  { file: 'data/react-learnings.json', section: 'react-learnings' },
  { file: 'data/react-guide.json', section: 'react-guide' },
  { file: 'data/advanced-react.json', section: 'advanced-react' },
  { file: 'data/algorithm-learnings.json', section: 'algorithm' },
  { file: 'data/blind75-learnings.json', section: 'blind75' },
];

/** Where a link target may live, for the existence check. */
const TARGET_FILES = {
  ...Object.fromEntries(CONTENT_FILES.map(({ file, section }) => [file, section])),
  'data/coding-questions.json': 'coding',
};

/**
 * Every section that can be linked TO, including the ones this pass does not
 * write into. Used to turn `[/coding/41](/coding/41)` — a link whose text is
 * its own URL, of which the content had ~180 — into the entry's actual title.
 */
const TITLE_FILES = {
  ...TARGET_FILES,
  'data/test-prep.json': 'test-prep',
  'data/acceldata-prep.json': 'acceldata-prep',
  'questions.json': 'mcq',
  'data/output-questions.json': 'output',
};

/** Files whose prose gets the bare-link fix, and the fields to look in. */
const TITLEISE_FILES = [
  ...Object.keys(TITLE_FILES).map((file) => ({ file, fields: ['answer', 'explanation', 'description'] })),
];

/**
 * Total internal links an entry may carry, hand-written ones included.
 *
 * Counting what is already there is what makes the pass idempotent: a second
 * run sees the links the first one added, finds no budget left, and changes
 * nothing — which is what `--check` depends on. It also means an entry that
 * already links six places by hand is left alone, and that is the right call.
 */
const MAX_LINKS_PER_ENTRY = 6;

const EXISTING_LINK = /\]\(\/[a-z0-9-]+\/\d+\)/g;

/* ── Protected regions ────────────────────────────────────────────── */

const PROTECT = [
  /```[\s\S]*?```/g, // fenced code, traces and mermaid included
  /`[^`\n]*`/g, // inline code
  /!?\[[^\]\n]*\]\([^)\n]*\)/g, // links and images
  /^#{1,6}[^\n]*$/gm, // headings
  /<[^>\n]{1,120}>/g, // raw HTML
  /\$[^$\n]{1,120}\$/g, // TeX
];

function maskOf(text) {
  const mask = new Uint8Array(text.length);
  for (const re of PROTECT) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      mask.fill(1, m.index, m.index + m[0].length);
      if (m[0].length === 0) re.lastIndex += 1;
    }
  }
  return mask;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Word-ish boundaries that still work for `HTTP/2` and `React.memo`. */
function termRe(term) {
  return new RegExp(`(?<![\\w-])${escapeRe(term)}(?![\\w-])`, 'gi');
}

/* ── The pass ─────────────────────────────────────────────────────── */

const TERMS = TOPICS.flatMap((topic) =>
  topic.terms.map((term) => ({ ...topic, term, re: termRe(term) })),
).sort((a, b) => b.term.length - a.term.length);

/** Returns the new markdown plus the links it added. */
export function linkEntry(markdown, { section, id }) {
  let text = markdown;
  const added = [];
  const budget = MAX_LINKS_PER_ENTRY - (markdown.match(EXISTING_LINK)?.length ?? 0);
  if (budget <= 0) return { text, added };

  for (const topic of TERMS) {
    if (added.length >= budget) break;
    if (topic.section === section && topic.id === id) continue; // no self-links
    const href = `/${topic.section}/${topic.id}`;
    if (text.includes(`](${href})`)) continue; // already linked, by hand or earlier

    const mask = maskOf(text);
    topic.re.lastIndex = 0;
    let m;
    while ((m = topic.re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      let free = true;
      for (let i = start; i < end; i += 1) if (mask[i]) { free = false; break; }
      if (!free) continue;

      text = `${text.slice(0, start)}[${m[0]}](${href})${text.slice(end)}`;
      added.push({ term: m[0], href });
      break;
    }
  }

  return { text, added };
}

/** section → id → display title. */
function titleIndex() {
  const index = new Map();
  for (const [file, section] of Object.entries(TITLE_FILES)) {
    const data = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
    const items = data.learnings ?? data.questions ?? [];
    if (!index.has(section)) index.set(section, new Map());
    for (const item of items) {
      // MCQ and output questions have no title, and their question text is a
      // whole sentence — a numbered label reads better in a practice list.
      const title =
        item.title ??
        (section === 'mcq' ? `MCQ ${item.id}` : section === 'output' ? `Output ${item.id}` : null);
      if (title) index.get(section).set(item.id, title);
    }
  }
  return index;
}

const BARE_LINK = /\[\/([a-z0-9-]+)\/(\d+)\]\(\/([a-z0-9-]+)\/(\d+)\)/g;

/** `[/coding/41](/coding/41)` → `[LRU Cache](/coding/41)`. */
function titleiseBareLinks(text, index) {
  let count = 0;
  const out = text.replace(BARE_LINK, (whole, s1, id1, s2, id2) => {
    if (s1 !== s2 || id1 !== id2) return whole;
    const title = index.get(s1)?.get(Number(id1));
    if (!title) return whole;
    count += 1;
    return `[${title}](/${s1}/${id1})`;
  });
  return { text: out, count };
}

function runTitleise({ write, index }) {
  let fixed = 0;
  let files = 0;

  for (const { file, fields } of TITLEISE_FILES) {
    const path = join(ROOT, file);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const items = data.learnings ?? data.questions ?? [];
    let changed = false;

    for (const item of items) {
      for (const field of fields) {
        if (typeof item[field] !== 'string') continue;
        const { text, count } = titleiseBareLinks(item[field], index);
        if (!count) continue;
        item[field] = text;
        fixed += count;
        changed = true;
      }
    }

    if (changed) {
      files += 1;
      if (write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
    }
  }

  return { fixed, files };
}

function run({ write }) {
  const report = [];
  let changedFiles = 0;
  let totalLinks = 0;

  for (const { file, section } of CONTENT_FILES) {
    const path = join(ROOT, file);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let changed = false;

    for (const entry of data.learnings) {
      const { text, added } = linkEntry(entry.answer, { section, id: entry.id });
      if (!added.length) continue;
      entry.answer = text;
      changed = true;
      totalLinks += added.length;
      report.push(`  ${section}/${entry.id}  ${added.map((a) => `${a.term} → ${a.href}`).join(', ')}`);
    }

    if (changed) {
      changedFiles += 1;
      if (write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
    }
  }

  return { report, changedFiles, totalLinks };
}

/** Every target in the map must still exist — ids are URLs, and they move. */
function checkTargets() {
  const known = new Map();
  for (const [file, section] of Object.entries(TARGET_FILES)) {
    const data = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
    const items = data.learnings ?? data.questions ?? [];
    if (!known.has(section)) known.set(section, new Set());
    for (const item of items) known.get(section).add(item.id);
  }

  const missing = [];
  for (const topic of TOPICS) {
    if (!known.get(topic.section)?.has(topic.id)) {
      missing.push(`/${topic.section}/${topic.id} (${topic.terms[0]})`);
    }
  }
  return missing;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const dry = args.includes('--dry');

  const missing = checkTargets();
  if (missing.length) {
    console.error('✗ cross-link map points at entries that do not exist:');
    for (const m of missing) console.error(`  ${m}`);
    process.exitCode = 1;
    return;
  }

  const index = titleIndex();
  const titleised = runTitleise({ write: !check && !dry, index });

  const { report, changedFiles, totalLinks } = run({ write: !check && !dry });

  if (check) {
    if (titleised.fixed) {
      console.error(`✗ ${titleised.fixed} link(s) still show their URL as the link text. Run: node scripts/apply-cross-links.mjs`);
      process.exitCode = 1;
      return;
    }
    if (totalLinks) {
      console.error(`✗ ${totalLinks} cross-link(s) missing in ${changedFiles} file(s). Run: node scripts/apply-cross-links.mjs`);
      for (const line of report.slice(0, 30)) console.error(line);
      if (report.length > 30) console.error(`  …and ${report.length - 30} more entries`);
      process.exitCode = 1;
      return;
    }
    console.log(`✓ cross-links in sync (${TERMS.length} terms, ${TOPICS.length} topics)`);
    return;
  }

  for (const line of report) console.log(line);
  console.log(
    `${dry ? 'would add' : 'added'} ${totalLinks} link(s) across ${changedFiles} file(s) — ${TERMS.length} terms`,
  );
  console.log(
    `${dry ? 'would retitle' : 'retitled'} ${titleised.fixed} bare URL link(s) across ${titleised.files} file(s)`,
  );
}

main();
