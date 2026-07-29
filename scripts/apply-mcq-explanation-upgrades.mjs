import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_FILE = join(__dirname, '..', 'questions.json');
const UPGRADES_FILE = join(__dirname, 'mcq-explanation-upgrades.json');

const upgrades = JSON.parse(readFileSync(UPGRADES_FILE, 'utf-8'));

/** Answer corrections (verified in Node / browser sloppy). */
const answerFixes = {
  212: 'C',
  213: 'C',
  214: 'C',
  215: 'B',
  216: 'B',
  217: 'B',
};

/** Body fixes — missing inner invocation for bind + returned function pattern. */
const bodyFixes = {
  214: "```javascript\nvar obj = {\n  foo: function () {\n    return function () {\n      return this.a;\n    };\n  },\n  a: 10,\n};\nconsole.log(obj.foo.bind({ a: 40 })()());\n```",
  217: "```javascript\nvar obj = {\n  foo: function () {\n    return () => {\n      return this.a;\n    };\n  },\n  a: 10,\n};\nconsole.log(obj.foo.bind({ a: 70 })()());\n```",
};

const data = JSON.parse(readFileSync(QUESTIONS_FILE, 'utf-8'));
let explanationCount = 0;
let answerCount = 0;
let bodyCount = 0;

for (const q of data.questions) {
  const id = String(q.id);
  if (upgrades[id]) {
    q.explanation = upgrades[id];
    explanationCount++;
  }
  if (answerFixes[q.id]) {
    q.answer = answerFixes[q.id];
    answerCount++;
  }
  if (bodyFixes[q.id]) {
    q.body = bodyFixes[q.id];
    bodyCount++;
  }
}

writeFileSync(QUESTIONS_FILE, JSON.stringify(data, null, 2) + '\n');

console.log(`Applied ${explanationCount} explanation upgrades`);
console.log(`Fixed ${answerCount} answers, ${bodyCount} bodies`);
