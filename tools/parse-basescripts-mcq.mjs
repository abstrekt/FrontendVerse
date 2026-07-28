import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_URL =
  'https://basescripts.com/100-advanced-javascript-multiple-choice-questions-with-answers-and-explanations';
const WP_API =
  'https://basescripts.com/wp-json/wp/v2/posts?slug=100-advanced-javascript-multiple-choice-questions-with-answers-and-explanations';
const QUESTIONS_FILE = resolve(__dirname, '..', 'questions.json');

function decodeHtml(text) {
  return text
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '—')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  );
}

function normalizeCode(body) {
  const code = body
    .replace(/```javascript\n?/g, '')
    .replace(/```/g, '')
    .trim();
  return code.replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();
}

function formatOptionText(text) {
  const trimmed = text.trim();
  if (!trimmed) return '``';
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) return trimmed;
  return `\`${trimmed.replace(/`/g, '\\`')}\``;
}

function normalizeTitle() {
  return "What's the output?";
}

function buildBody(codeLines) {
  const code = codeLines.join('\n').trim();
  return `\`\`\`javascript\n${code}\n\`\`\``;
}

function parseQuestionsFromText(text) {
  const startIdx = text.search(/^Question:/im);
  const questionText = startIdx >= 0 ? text.slice(startIdx) : text;
  const blocks = questionText.split(/\n(?=Question:)/i).filter((b) => /^Question:/i.test(b.trim()));
  const questions = [];

  for (const block of blocks) {
    const headerMatch = block.match(/^Question:\s*(.+?)\s*$/im);
    if (!headerMatch) continue;

    const afterHeader = block.slice(block.indexOf(headerMatch[0]) + headerMatch[0].length);
    const lines = afterHeader
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const codeLines = [];
    const options = [];
    let answer = null;
    let explanation = null;
    let phase = 'code';

    for (const line of lines) {
      const optionMatch = line.match(/^-?\s*([a-d])\)\s*(.+)$/i);
      const answerMatch = line.match(/^-?\s*Answer:?\s*([a-d])\)?\s*(.*)$/i);
      const explanationMatch = line.match(/^-?\s*Explanation:?\s*(.*)$/i);

      if (answerMatch) {
        answer = answerMatch[1].toUpperCase();
        phase = 'answer';
        continue;
      }

      if (explanationMatch) {
        explanation = explanationMatch[1].trim();
        phase = 'explanation';
        continue;
      }

      if (optionMatch && phase !== 'explanation') {
        phase = 'options';
        options.push({
          key: optionMatch[1].toUpperCase(),
          text: formatOptionText(optionMatch[2]),
        });
        continue;
      }

      if (phase === 'explanation') {
        explanation = explanation ? `${explanation} ${line}` : line;
        continue;
      }

      if (phase === 'code' || (phase === 'options' && !optionMatch)) {
        if (!optionMatch) codeLines.push(line);
      }
    }

    if (options.length < 2 || !answer || !explanation) {
      console.warn('Skipping block: missing options/answer/explanation');
      continue;
    }

    if (!options.find((o) => o.key === answer)) {
      console.warn(`Skipping block: answer "${answer}" not in options`);
      continue;
    }

    questions.push({
      question: normalizeTitle(),
      body: buildBody(codeLines),
      options,
      answer,
      explanation,
      difficulty: 'advance',
      source: SOURCE_URL,
    });
  }

  return questions;
}

async function fetchArticleText() {
  const res = await fetch(WP_API);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching WP API`);
  const posts = await res.json();
  if (!posts.length) throw new Error('Post not found via WP API');
  return htmlToText(posts[0].content.rendered);
}

function findDuplicateId(normalized, existingMap) {
  return existingMap.get(normalized) ?? null;
}

function applyFixes(questions) {
  for (const q of questions) {
    const code = normalizeCode(q.body);
    if (code.includes('1 + "1" - 1') || code.includes("1 + '1' - 1")) {
      q.answer = 'B';
      q.explanation =
        'The `+` operator with a string and a number concatenates, so `1 + "1"` is `"11"`. Subtraction then coerces `"11"` to a number, so `"11" - 1` is `10`.';
    }
  }
}

async function main() {
  const text = await fetchArticleText();
  const parsed = parseQuestionsFromText(text);
  console.log(`Parsed ${parsed.length} questions from source`);

  applyFixes(parsed);

  const existing = JSON.parse(readFileSync(QUESTIONS_FILE, 'utf-8'));
  const existingMap = new Map();
  for (const q of existing.questions) {
    existingMap.set(normalizeCode(q.body), q.id);
  }

  const seen = new Set();
  const toAdd = [];
  const skipped = [];

  for (const q of parsed) {
    const norm = normalizeCode(q.body);
    if (seen.has(norm)) {
      skipped.push({ reason: 'duplicate in batch', code: norm.slice(0, 60) });
      continue;
    }
    seen.add(norm);

    const dupId = findDuplicateId(norm, existingMap);
    if (dupId) {
      skipped.push({ reason: `duplicate → existing id ${dupId}`, code: norm.slice(0, 60) });
      continue;
    }

    toAdd.push(q);
  }

  let nextId = Math.max(...existing.questions.map((q) => q.id), 0) + 1;
  for (const q of toAdd) {
    q.id = nextId++;
    existing.questions.push(q);
    existingMap.set(normalizeCode(q.body), q.id);
  }

  writeFileSync(QUESTIONS_FILE, JSON.stringify(existing, null, 2));

  console.log(`\nLoad summary:`);
  console.log(`  Parsed:  ${parsed.length}`);
  console.log(`  Skipped: ${skipped.length}`);
  for (const s of skipped) console.log(`    - ${s.reason}: ${s.code}…`);
  console.log(`  Added:   ${toAdd.length} (ids ${toAdd[0]?.id ?? '—'}–${toAdd[toAdd.length - 1]?.id ?? '—'})`);
  console.log(`  Total:   ${existing.questions.length} questions in ${QUESTIONS_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
