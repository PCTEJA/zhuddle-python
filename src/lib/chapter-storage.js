import { freshState } from './progress';

// Keep only the current bank's fields. Invalid saved data cannot lend another
// chapter scores or break rendering; the original storage entry is retained.
export function restoreChapter(saved, questions) {
  const base = freshState(questions);
  if (!saved || saved.version !== 1 || typeof saved.code !== 'object' || !saved.student) return base;
  for (const q of questions) {
    if (q.kind === 'code' && typeof saved.code?.[q.id] === 'string') base.code[q.id] = saved.code[q.id];
    if (q.kind === 'mcq' && q.options.some(o => o.letter === saved.choices?.[q.id])) base.choices[q.id] = saved.choices[q.id];
    const r = saved.results?.[q.id];
    if (r && typeof r.source === 'string' && Number.isFinite(r.earned) && r.earned >= 0 && r.earned <= q.points &&
        Array.isArray(r.checks) && r.checks.every(c => typeof c.label === 'string' && Number.isFinite(c.earned))) {
      base.results[q.id] = r;
    }
  }
  if (typeof saved.student.name === 'string' && typeof saved.student.untId === 'string') base.student = saved.student;
  if (typeof saved.reflection === 'string') base.reflection = saved.reflection;
  if (questions.some(q => q.id === saved.active)) base.active = saved.active;
  return base;
}
