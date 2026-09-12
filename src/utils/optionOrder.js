const KEYS = 'ABCDEFGH';

/**
 * Deterministic PRNG (mulberry32). Seeded per question so the order is stable
 * across reloads and across a session — a question that reshuffled every render
 * would be unusable.
 */
function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seed) {
  const random = seededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Order a question's options for display and re-letter them A, B, C…
 *
 * The authored data has a severe position bias — across 189 MCQs option D is
 * correct only 23 times, and in one imported batch of 50 it is correct once.
 * A test-taker learns to guess B rather than to read the code. Shuffling at
 * render time fixes that without rewriting the content.
 *
 * Safe because no explanation refers to options by letter; the displayed key
 * returned as `answer` is what the UI must compare against and show.
 *
 * @returns {{ options: Array<{key: string, text: string}>, answer: string }}
 */
export function presentOptions(options = [], answerKey, seed = 0) {
  if (!options.length) return { options: [], answer: answerKey };

  const shuffled = seededShuffle(options, Number(seed) || 0);
  const presented = shuffled.map((option, index) => ({
    ...option,
    key: KEYS[index] ?? option.key,
  }));

  const answerIndex = shuffled.findIndex((option) => option.key === answerKey);
  return {
    options: presented,
    // Fall back to the authored key if the answer is not among the options,
    // rather than silently marking every response wrong.
    answer: answerIndex >= 0 ? presented[answerIndex].key : answerKey,
  };
}
