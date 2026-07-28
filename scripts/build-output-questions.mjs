import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const README_URL =
  'https://raw.githubusercontent.com/surbhidighe/Javascript-Output-Based-Questions/master/README.md';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'data', 'output-questions.json');

const QUESTION_HEADING = /\*\*(\d+)\.\s*What will be the output[^*]*\*\*/gi;

function formatConsoleArg(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return value.toString();
  if (value === undefined) return 'undefined';
  if (Number.isNaN(value)) return 'NaN';
  if (value === null) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatConsoleLine(args) {
  return args.map(formatConsoleArg).join(' ');
}

function createTimerSandbox(baseContext) {
  const macrotasks = [];
  const microtasks = [];

  const patchedSetTimeout = (fn, delay = 0, ...args) => {
    macrotasks.push({ fn, args, order: macrotasks.length });
    return macrotasks.length;
  };

  const patchedSetInterval = (fn, delay = 0, ...args) => {
    return patchedSetTimeout(fn, delay, ...args);
  };

  const patchedQueueMicrotask = (fn) => {
    microtasks.push(fn);
  };

  const context = vm.createContext({
    ...baseContext,
    setTimeout: patchedSetTimeout,
    setInterval: patchedSetInterval,
    clearTimeout: () => {},
    clearInterval: () => {},
    queueMicrotask: patchedQueueMicrotask,
  });

  async function flushAsync() {
    await Promise.resolve();

    while (microtasks.length > 0) {
      const batch = microtasks.splice(0, microtasks.length);
      for (const task of batch) {
        task();
      }
      await Promise.resolve();
    }

    while (macrotasks.length > 0) {
      const batch = macrotasks.splice(0, macrotasks.length);
      for (const task of batch) {
        task.fn(...task.args);
      }
      await Promise.resolve();

      if (microtasks.length > 0) {
        const microBatch = microtasks.splice(0, microtasks.length);
        for (const task of microBatch) {
          task();
        }
        await Promise.resolve();
      }
    }
  }

  return { context, flushAsync };
}

async function runCodeInNode(code) {
  const lines = [];
  let error = null;

  const sandboxConsole = {
    log: (...args) => lines.push(formatConsoleLine(args)),
    info: (...args) => lines.push(formatConsoleLine(args)),
    warn: (...args) => lines.push(formatConsoleLine(args)),
    error: (...args) => lines.push(formatConsoleLine(args)),
  };

  const baseContext = {
    console: sandboxConsole,
    Promise,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Symbol,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Date,
    RegExp,
    Error,
    TypeError,
    ReferenceError,
    SyntaxError,
    RangeError,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    undefined,
    NaN,
    Infinity,
  };

  const { context, flushAsync } = createTimerSandbox(baseContext);

  try {
    const script = new vm.Script(code, { filename: 'question.js' });
    script.runInContext(context);
    await flushAsync();
  } catch (err) {
    error = err?.name && err?.message ? `${err.name}: ${err.message}` : String(err);
  }

  const async =
    /\bsetTimeout\b|\bsetInterval\b|\bPromise\b|\.then\s*\(|async\s+function|await\s+/.test(code);

  return { lines, error, async };
}

function extractCode(block) {
  const fenced = block.match(/```(?:js|javascript)\n([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return block.trim();
}

function extractDetails(block) {
  const outputMatch = block.match(/<b>Output<\/b>\s*:\s*([^<]+)/i);
  const reasonMatches = [...block.matchAll(/<b>Reason(?:\s+for[^<]*)?<\/b>\s*:\s*([^<]+)/gi)];

  const readmeOutput = outputMatch?.[1]?.trim().replace(/\s+/g, ' ') ?? '';
  const explanation = reasonMatches
    .map((match) => match[1].trim())
    .filter(Boolean)
    .join('\n\n');

  return { readmeOutput, explanation };
}

function parseQuestions(readme) {
  const questions = [];
  const matches = [...readme.matchAll(QUESTION_HEADING)];

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const id = Number(match[1]);
    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : readme.length;
    const block = readme.slice(start, end).trim();
    const code = extractCode(block);
    const { readmeOutput, explanation } = extractDetails(block);

    questions.push({
      id,
      question: 'What will be the output?',
      code,
      body: `\`\`\`javascript\n${code}\n\`\`\``,
      readmeOutput,
      explanation,
    });
  }

  return questions.sort((a, b) => a.id - b.id);
}

async function main() {
  const response = await fetch(README_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
  }

  const readme = await response.text();
  const parsed = parseQuestions(readme);

  if (parsed.length === 0) {
    throw new Error('No questions parsed from README');
  }

  const questions = [];

  for (const item of parsed) {
    const { lines, error, async } = await runCodeInNode(item.code);
    const expectedLines = error ? [error] : lines;

    questions.push({
      id: item.id,
      question: item.question,
      body: item.body,
      code: item.code,
      expectedLines,
      explanation: item.explanation,
      readmeOutput: item.readmeOutput,
      async,
    });

    console.log(
      `#${item.id} ${async ? '[async]' : '[sync]'} -> ${expectedLines.join(' | ') || '(no output)'}`
    );
  }

  const payload = {
    source: 'https://github.com/surbhidighe/Javascript-Output-Based-Questions',
    questions,
  };

  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${questions.length} questions to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
