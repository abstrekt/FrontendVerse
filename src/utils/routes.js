export const LEARNING_SECTIONS = [
  'interview-prep',
  'test-prep',
  'learnings',
  'css',
  'react-learnings',
  'react-guide',
  'advanced-react',
  'hld',
  'algorithm',
];

const ITEM_SECTIONS = ['coding', 'output'];

function parseId(part) {
  const parsed = part ? Number(part) : null;
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyRoute(section, overrides = {}) {
  return {
    section,
    viewMode: 'quiz',
    learningId: null,
    itemId: null,
    ...overrides,
  };
}

export function parseRoute(pathname) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);

  if (parts.length === 0) {
    return emptyRoute('mcq');
  }

  if (LEARNING_SECTIONS.includes(parts[0])) {
    return emptyRoute(parts[0], { learningId: parseId(parts[1]) });
  }

  if (ITEM_SECTIONS.includes(parts[0])) {
    return emptyRoute(parts[0], { itemId: parseId(parts[1]) });
  }

  if (parts[0] === 'archived') {
    return emptyRoute('archived');
  }

  if (parts[1] === 'list') {
    return emptyRoute('mcq', { viewMode: 'list' });
  }

  return emptyRoute('mcq', { itemId: parseId(parts[1]) });
}

export function buildRoute({
  section = 'mcq',
  viewMode = 'quiz',
  learningId = null,
  itemId = null,
} = {}) {
  if (LEARNING_SECTIONS.includes(section)) {
    return learningId ? `/${section}/${learningId}` : `/${section}`;
  }

  if (ITEM_SECTIONS.includes(section)) {
    return itemId ? `/${section}/${itemId}` : `/${section}`;
  }

  if (section === 'archived') {
    return '/archived';
  }

  if (viewMode === 'list') {
    return '/mcq/list';
  }

  return itemId ? `/mcq/${itemId}` : '/mcq';
}
