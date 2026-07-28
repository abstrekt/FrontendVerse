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

  if (parts[0] === 'output') {
    return { section: 'output', viewMode: 'quiz', learningId: null };
  }

  if (parts[0] === 'coding') {
    return { section: 'coding', viewMode: 'quiz', learningId: null };
  }

  const viewMode = parts[1] === 'list' ? 'list' : 'quiz';
  return { section: 'mcq', viewMode, learningId: null };
}

export function buildRoute({ section = 'mcq', viewMode = 'quiz', learningId = null } = {}) {
  if (section === 'learnings') {
    return learningId ? `/learnings/${learningId}` : '/learnings';
  }

  if (section === 'output') {
    return '/output';
  }

  if (section === 'coding') {
    return '/coding';
  }

  return viewMode === 'list' ? '/mcq/list' : '/mcq';
}
