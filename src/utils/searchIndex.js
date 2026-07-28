const SECTION_LABELS = {
  mcq: 'MCQ',
  learnings: 'Learnings',
  'react-learnings': 'React',
  hld: 'HLD',
  coding: 'Coding',
  output: 'Output',
};

const FIELD_LABELS = {
  title: 'In title',
  body: 'In content',
  explanation: 'In explanation',
  description: 'In description',
  code: 'In code',
  options: 'In options',
  tags: 'In tags',
  topics: 'In topics',
  company: 'In company',
  difficulty: 'In difficulty',
  functionName: 'In function',
};

const FIELD_WEIGHTS = {
  title: 100,
  company: 80,
  tags: 70,
  topics: 70,
  difficulty: 50,
  functionName: 45,
  options: 30,
  description: 25,
  explanation: 20,
  body: 15,
  code: 15,
};

const SNIPPET_FIELDS = new Set(['body', 'explanation', 'description', 'code', 'options']);

export const SEARCH_SECTIONS = [
  'all',
  'mcq',
  'learnings',
  'react-learnings',
  'hld',
  'coding',
  'output',
];

export function getSectionLabel(section) {
  return SECTION_LABELS[section] ?? section;
}

export function normalizeQuery(query) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function tokenizeQuery(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

export function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMcqDoc(item) {
  const topics = item.topics ?? [];
  return {
    key: `mcq:${item.id}`,
    section: 'mcq',
    id: item.id,
    title: item.question ?? '',
    company: null,
    tags: topics,
    difficulty: item.difficulty ?? null,
    fields: [
      { name: 'title', text: item.question ?? '' },
      { name: 'body', text: stripMarkdown(item.body ?? '') },
      { name: 'explanation', text: stripMarkdown(item.explanation ?? '') },
      {
        name: 'options',
        text: (item.options ?? []).map((o) => o.text ?? '').join(' '),
      },
      { name: 'topics', text: topics.join(' ') },
      { name: 'difficulty', text: item.difficulty ?? '' },
    ],
  };
}

function buildLearningDoc(item, section) {
  const tags = item.tags ?? [];
  return {
    key: `${section}:${item.id}`,
    section,
    id: item.id,
    title: item.title ?? '',
    company: item.company ?? null,
    tags,
    difficulty: null,
    fields: [
      { name: 'title', text: item.title ?? '' },
      { name: 'company', text: item.company ?? '' },
      { name: 'tags', text: tags.join(' ') },
      { name: 'body', text: stripMarkdown(item.answer ?? '') },
    ],
  };
}

function buildCodingDoc(item) {
  const topics = item.topics ?? [];
  return {
    key: `coding:${item.id}`,
    section: 'coding',
    id: item.id,
    title: item.title ?? '',
    company: null,
    tags: topics,
    difficulty: item.difficulty ?? null,
    fields: [
      { name: 'title', text: item.title ?? '' },
      { name: 'description', text: stripMarkdown(item.description ?? '') },
      { name: 'explanation', text: stripMarkdown(item.explanation ?? '') },
      { name: 'topics', text: topics.join(' ') },
      { name: 'difficulty', text: item.difficulty ?? '' },
      { name: 'functionName', text: item.functionName ?? '' },
    ],
  };
}

function buildOutputDoc(item) {
  return {
    key: `output:${item.id}`,
    section: 'output',
    id: item.id,
    title: item.question ?? '',
    company: null,
    tags: [],
    difficulty: null,
    fields: [
      { name: 'title', text: item.question ?? '' },
      { name: 'body', text: stripMarkdown(item.body ?? '') },
      { name: 'code', text: item.code ?? '' },
      { name: 'explanation', text: stripMarkdown(item.explanation ?? '') },
    ],
  };
}

export function buildSearchIndex({
  mcq = [],
  learnings = [],
  reactLearnings = [],
  hld = [],
  coding = [],
  output = [],
} = {}) {
  return [
    ...mcq.map(buildMcqDoc),
    ...learnings.map((item) => buildLearningDoc(item, 'learnings')),
    ...reactLearnings.map((item) => buildLearningDoc(item, 'react-learnings')),
    ...hld.map((item) => buildLearningDoc(item, 'hld')),
    ...coding.map(buildCodingDoc),
    ...output.map(buildOutputDoc),
  ];
}

function findTokenRanges(text, token) {
  const ranges = [];
  const haystack = text.toLowerCase();
  if (!token || !haystack) return ranges;

  let start = 0;
  while (start < haystack.length) {
    const index = haystack.indexOf(token, start);
    if (index === -1) break;
    ranges.push({ start: index, end: index + token.length });
    start = index + token.length;
  }
  return ranges;
}

export function mergeRanges(ranges) {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

export function findMatchRanges(text, tokens) {
  if (!text || !tokens.length) return [];
  const allRanges = tokens.flatMap((token) => findTokenRanges(text, token));
  return mergeRanges(allRanges);
}

function getFirstMatchIndex(text, tokens) {
  const haystack = text.toLowerCase();
  let first = Infinity;
  for (const token of tokens) {
    const index = haystack.indexOf(token);
    if (index !== -1) first = Math.min(first, index);
  }
  return first === Infinity ? -1 : first;
}

function extractSnippet(text, tokens, maxLen = 110) {
  const plain = stripMarkdown(text);
  if (!plain) return null;

  const matchIndex = getFirstMatchIndex(plain, tokens);
  if (matchIndex === -1) return null;

  const half = Math.floor((maxLen - 3) / 2);
  let start = Math.max(0, matchIndex - half);
  let end = Math.min(plain.length, start + maxLen);

  if (end - start < maxLen) {
    start = Math.max(0, end - maxLen);
  }

  let snippet = plain.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < plain.length) snippet = `${snippet}…`;

  return {
    text: snippet,
    highlights: findMatchRanges(snippet, tokens),
  };
}

function fieldMatches(field, tokens) {
  const haystack = field.text.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function scoreField(field, tokens) {
  if (!fieldMatches(field, tokens)) return null;

  const weight = FIELD_WEIGHTS[field.name] ?? 10;
  const firstIndex = getFirstMatchIndex(field.text, tokens);
  return weight * 1000 - firstIndex;
}

function tagsMatchQuery(tags, tokens) {
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  return tags.filter((tag) => {
    const lower = tag.toLowerCase();
    return tokens.some((token) => lower.includes(token));
  });
}

export function searchIndex(docs, query, { section = 'all', limit = 40 } = {}) {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];

  const filteredDocs =
    section === 'all' ? docs : docs.filter((doc) => doc.section === section);

  const results = [];

  for (const doc of filteredDocs) {
    const matchedFields = [];
    let bestScore = -1;
    let bestSnippetField = null;

    for (const field of doc.fields) {
      const score = scoreField(field, tokens);
      if (score === null) continue;
      matchedFields.push(field.name);
      if (score > bestScore) {
        bestScore = score;
        if (SNIPPET_FIELDS.has(field.name) && field.name !== 'title') {
          bestSnippetField = field;
        }
      }
    }

    if (!matchedFields.length) continue;

    const titleField = doc.fields.find((f) => f.name === 'title');
    const titleHighlights = findMatchRanges(titleField?.text ?? doc.title, tokens);

    let snippet = null;
    let snippetHighlights = [];
    let snippetFieldLabel = null;
    if (bestSnippetField && bestSnippetField.text.trim()) {
      const extracted = extractSnippet(bestSnippetField.text, tokens);
      if (extracted) {
        snippet = extracted.text;
        snippetHighlights = extracted.highlights;
        snippetFieldLabel = FIELD_LABELS[bestSnippetField.name] ?? 'In content';
      }
    }

    const matchedTags = tagsMatchQuery(doc.tags ?? [], tokens);

    results.push({
      key: doc.key,
      section: doc.section,
      sectionLabel: getSectionLabel(doc.section),
      id: doc.id,
      title: doc.title,
      company: doc.company,
      tags: doc.tags ?? [],
      difficulty: doc.difficulty,
      matchedFields,
      matchedTags,
      titleHighlights,
      snippet,
      snippetHighlights,
      snippetFieldLabel,
      score: bestScore,
    });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });

  return results.slice(0, limit);
}

export function highlightText(text, ranges) {
  if (!text) return [{ text: '', highlight: false }];
  if (!ranges?.length) return [{ text, highlight: false }];

  const parts = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      parts.push({ text: text.slice(cursor, range.start), highlight: false });
    }
    if (range.end > range.start) {
      parts.push({ text: text.slice(range.start, range.end), highlight: true });
    }
    cursor = range.end;
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlight: false });
  }

  return parts.length ? parts : [{ text, highlight: false }];
}
