import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import prettier from 'prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CONTENT_FILES = [
  { file: 'questions.json', key: 'questions', fields: ['body', 'explanation'] },
  { file: 'data/output-questions.json', key: 'questions', fields: ['body', 'explanation'], syncCode: true },
  { file: 'data/scope-output-questions.json', key: 'questions', fields: ['body', 'explanation'], syncCode: true },
  { file: 'data/coding-questions.json', key: 'questions', fields: ['description', 'explanation'] },
  { file: 'data/learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/algorithm-learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/react-learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/hld-learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/polyfill-learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/tekion-interview-learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/wtfjs-learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/devto-interview-learnings.json', key: 'learnings', fields: ['answer'] },
  { file: 'data/senior-frontend-learnings.json', key: 'learnings', fields: ['answer'] },
];

const FENCE_RE = /```(\w*)\n([\s\S]*?)\n```/g;

const JS_LANGS = new Set(['javascript', 'js']);
const SKIP_LANGS = new Set(['', 'mermaid']);

const PRETTIER_JS_OPTS = {
  parser: 'babel',
  tabWidth: 2,
  semi: true,
  printWidth: 80,
};

const PRETTIER_HTML_OPTS = {
  parser: 'html',
  tabWidth: 2,
  printWidth: 80,
};

function normalizeLang(lang) {
  if (lang === 'js') return 'javascript';
  return lang;
}

async function formatFenceCode(lang, code) {
  const normalized = normalizeLang(lang);
  if (SKIP_LANGS.has(lang) || SKIP_LANGS.has(normalized)) {
    return { code, lang, changed: false, skipped: true };
  }

  if (JS_LANGS.has(lang) || JS_LANGS.has(normalized)) {
    try {
      const formatted = await prettier.format(code, PRETTIER_JS_OPTS);
      const trimmed = formatted.replace(/\n$/, '');
      return {
        code: trimmed,
        lang: 'javascript',
        changed: trimmed !== code || lang !== 'javascript',
        skipped: false,
      };
    } catch (err) {
      console.warn(`  [warn] JS format failed (${lang}): ${err.message}`);
      return { code, lang: normalized, changed: false, skipped: true };
    }
  }

  if (lang === 'html') {
    try {
      const formatted = await prettier.format(code, PRETTIER_HTML_OPTS);
      const trimmed = formatted.replace(/\n$/, '');
      return {
        code: trimmed,
        lang: 'html',
        changed: trimmed !== code,
        skipped: false,
      };
    } catch (err) {
      console.warn(`  [warn] HTML format failed: ${err.message}`);
      return { code, lang, changed: false, skipped: true };
    }
  }

  return { code, lang, changed: false, skipped: true };
}

async function formatMarkdownField(text) {
  if (!text || typeof text !== 'string') {
    return { text, stats: { formatted: 0, skipped: 0, unchanged: 0 } };
  }

  const stats = { formatted: 0, skipped: 0, unchanged: 0 };
  let changed = false;

  const parts = [];
  let lastIndex = 0;
  FENCE_RE.lastIndex = 0;

  let match;
  while ((match = FENCE_RE.exec(text)) !== null) {
    parts.push(text.slice(lastIndex, match.index));

    const [, lang, code] = match;
    const result = await formatFenceCode(lang, code);

    if (result.skipped) {
      stats.skipped++;
      parts.push(`\`\`\`${lang}\n${code}\n\`\`\``);
    } else if (result.changed) {
      stats.formatted++;
      changed = true;
      parts.push(`\`\`\`${result.lang}\n${result.code}\n\`\`\``);
    } else {
      stats.unchanged++;
      parts.push(`\`\`\`${result.lang}\n${result.code}\n\`\`\``);
    }

    lastIndex = match.index + match[0].length;
  }

  parts.push(text.slice(lastIndex));

  return {
    text: changed ? parts.join('') : text,
    stats,
    changed,
  };
}

function extractCodeFromBody(body) {
  const match = body?.match(/```(?:javascript|js)\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

async function processFile(config) {
  const filePath = join(ROOT, config.file);
  const raw = readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const items = data[config.key];

  const fileStats = { formatted: 0, skipped: 0, unchanged: 0, itemsChanged: 0, codeSynced: 0 };
  let fileChanged = false;

  for (const item of items) {
    let itemChanged = false;

    for (const field of config.fields) {
      const result = await formatMarkdownField(item[field]);
      fileStats.formatted += result.stats.formatted;
      fileStats.skipped += result.stats.skipped;
      fileStats.unchanged += result.stats.unchanged;

      if (result.changed) {
        item[field] = result.text;
        itemChanged = true;
      }
    }

    if (config.syncCode && item.body) {
      const extracted = extractCodeFromBody(item.body);
      if (extracted !== null && extracted !== item.code) {
        item.code = extracted;
        itemChanged = true;
        fileStats.codeSynced++;
      }
    }

    if (itemChanged) {
      fileStats.itemsChanged++;
      fileChanged = true;
    }
  }

  if (fileChanged) {
    writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }

  return { file: config.file, changed: fileChanged, ...fileStats };
}

async function main() {
  console.log('Formatting fenced code snippets...\n');

  const results = [];
  for (const config of CONTENT_FILES) {
    const result = await processFile(config);
    results.push(result);
    const status = result.changed ? 'updated' : 'unchanged';
    console.log(
      `${result.file}: ${status} — ${result.formatted} formatted, ${result.unchanged} ok, ${result.skipped} skipped` +
        (result.codeSynced ? `, ${result.codeSynced} code fields synced` : ''),
    );
  }

  const totals = results.reduce(
    (acc, r) => ({
      filesChanged: acc.filesChanged + (r.changed ? 1 : 0),
      formatted: acc.formatted + r.formatted,
      skipped: acc.skipped + r.skipped,
      codeSynced: acc.codeSynced + r.codeSynced,
    }),
    { filesChanged: 0, formatted: 0, skipped: 0, codeSynced: 0 },
  );

  console.log(
    `\nDone: ${totals.filesChanged} file(s) updated, ${totals.formatted} fence(s) reformatted, ${totals.skipped} skipped, ${totals.codeSynced} code field(s) synced.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
