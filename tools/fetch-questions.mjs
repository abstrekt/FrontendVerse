import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const README_URL = 'https://raw.githubusercontent.com/lydiahallie/javascript-questions/master/README.md';
const OUTPUT = resolve(__dirname, '..', 'questions.json');

async function main() {
  const res = await fetch(README_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching README`);
  const text = await res.text();

  // Split on newline before each "###### N." question header
  const blocks = text.split(/\n(?=######\s+\d+\.)/);
  const questions = [];

  for (const block of blocks) {
    const headerMatch = block.match(/^######\s+(\d+)\.\s+(.+)/m);
    if (!headerMatch) continue;

    const id = parseInt(headerMatch[1], 10);
    const title = headerMatch[2].trim();

    // Content after the header line
    const afterHeader = block.slice(block.indexOf(headerMatch[0]) + headerMatch[0].length);

    // Find where options start (lines like "- A: ...")
    const optStartIdx = afterHeader.search(/^- [A-Z]:/m);
    if (optStartIdx === -1) {
      console.warn(`Question ${id}: no options found`);
      continue;
    }

    const body = afterHeader.slice(0, optStartIdx).trim();
    let rest = afterHeader.slice(optStartIdx);

    // Find where the details/answer section starts
    const detailIdx = rest.search(/(?:<details|<summary|####\s+Answer:)/i);
    if (detailIdx === -1) {
      console.warn(`Question ${id}: no answer block found`);
      continue;
    }

    const optionsSection = rest.slice(0, detailIdx);
    rest = rest.slice(detailIdx);

    // Parse options — each line starts with "- X:"
    const optionLines = optionsSection.split('\n').filter(l => /^- [A-Z]:/.test(l));
    const options = optionLines.map(line => {
      const m = line.match(/^- ([A-Z]):\s?(.*)/);
      return { key: m[1], text: m[2].trim() };
    });

    // Extract answer letter
    const answerMatch = rest.match(/####\s+Answer:\s*([A-Z])/i);
    if (!answerMatch) {
      console.warn(`Question ${id}: no "#### Answer:" found`);
      continue;
    }
    const answer = answerMatch[1];

    // Extract explanation (everything after "#### Answer: X" until </details>)
    const ansPos = rest.indexOf(answerMatch[0]);
    let explanation = rest.slice(ansPos + answerMatch[0].length);
    explanation = explanation.replace(/<\/details>[\s\S]*$/m, '').trim();
    explanation = explanation.replace(/^\n+/, '').replace(/\n+$/, '');

    if (options.length < 2) {
      console.warn(`Question ${id}: only ${options.length} option(s), skipping`);
      continue;
    }
    if (!options.find(o => o.key === answer)) {
      console.warn(`Question ${id}: answer "${answer}" not in options, skipping`);
      continue;
    }

    questions.push({
      id,
      question: title,
      body: body || '',
      options,
      answer,
      explanation: explanation || '',
    });
  }

  writeFileSync(OUTPUT, JSON.stringify({ questions }, null, 2));
  console.log(`✓ Parsed ${questions.length} questions → ${OUTPUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
