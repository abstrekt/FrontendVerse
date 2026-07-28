export function parseRoute(pathname) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);

  if (parts.length === 0) {
    return { section: 'mcq', viewMode: 'quiz', learningId: null };
  }

  if (parts[0] === 'learnings') {
    const parsedId = parts[1] ? Number(parts[1]) : null;
    return {
      section: 'learnings',
      viewMode: 'quiz',
      learningId: Number.isFinite(parsedId) ? parsedId : null,
    };
  }

  if (parts[0] === 'react-learnings') {
    const parsedId = parts[1] ? Number(parts[1]) : null;
    return {
      section: 'react-learnings',
      viewMode: 'quiz',
      learningId: Number.isFinite(parsedId) ? parsedId : null,
    };
  }

  if (parts[0] === 'hld') {
    const parsedId = parts[1] ? Number(parts[1]) : null;
    return {
      section: 'hld',
      viewMode: 'quiz',
      learningId: Number.isFinite(parsedId) ? parsedId : null,
    };
  }

  if (parts[0] === 'output') {
    return { section: 'output', viewMode: 'quiz', learningId: null };
  }

  if (parts[0] === 'coding') {
    return { section: 'coding', viewMode: 'quiz', learningId: null };
  }

  if (parts[0] === 'archived') {
    return { section: 'archived', viewMode: 'quiz', learningId: null };
  }

  const viewMode = parts[1] === 'list' ? 'list' : 'quiz';
  return { section: 'mcq', viewMode, learningId: null };
}

export function buildRoute({ section = 'mcq', viewMode = 'quiz', learningId = null } = {}) {
  if (section === 'learnings') {
    return learningId ? `/learnings/${learningId}` : '/learnings';
  }

  if (section === 'react-learnings') {
    return learningId ? `/react-learnings/${learningId}` : '/react-learnings';
  }

  if (section === 'hld') {
    return learningId ? `/hld/${learningId}` : '/hld';
  }

  if (section === 'output') {
    return '/output';
  }

  if (section === 'coding') {
    return '/coding';
  }

  if (section === 'archived') {
    return '/archived';
  }

  return viewMode === 'list' ? '/mcq/list' : '/mcq';
}
