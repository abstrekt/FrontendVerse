import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, '..', 'questions.json');

const topics = {
  hoisting: /\bhoist/i,
  closures: /\bclosure/i,
  this: /\bthis\b/i,
  prototypes: /\bprototype/i,
  promises: /\bpromise\b/i,
  'async/await': /\basync|await\b/i,
  coercion: /\bcoercion|type conversion|implicit|truthy|falsy\b/i,
  scope: /\bscope|global|block[\s-]scope/i,
  'event loop': /\bevent loop|microtask|macrotask|call stack|setTimeout|setInterval\b/i,
  classes: /\bclass\b|constructor|extends|super\(/i,
  modules: /\bmodule|import|export|require\(/i,
  destructuring: /\bdestructur/i,
  'spread/rest': /\bspread|rest operator|\.\.\./i,
  generators: /\bgenerator|yield|\*/i,
  'arrow functions': /\barrow function/i,
  'template literals': /\btemplate literal/i,
  'object methods': /\bobject|property|method\b/i,
  'array methods': /\bmap|filter|reduce|forEach|slice|splice|push|pop\b/i,
  regex: /\bregex|regular expression/i,
  'error handling': /\btry|catch|throw|error/i,
  'strict mode': /\bstrict mode/i,
  symbols: /\bSymbol\b/i,
  'map/set': /\bMap\b|\bSet\b/i,
  proxy: /\bProxy/i,
  'tagged templates': /\btagged template/i,
  'data types': /\bdata type|typeof|instanceof|primitives\b/i,
};

function tagQuestions(data) {
  for (const q of data.questions) {
    const text = (q.explanation + ' ' + q.body + ' ' + q.question).toLowerCase();
    const tags = [];
    for (const [topic, regex] of Object.entries(topics)) {
      if (regex.test(text)) tags.push(topic);
    }
    q.topics = tags.sort();
  }
  return data;
}

const data = JSON.parse(readFileSync(INPUT, 'utf-8'));
const tagged = tagQuestions(data);
writeFileSync(INPUT, JSON.stringify(tagged, null, 2));
console.log(`✓ Tagged ${tagged.questions.length} questions → ${INPUT}`);
