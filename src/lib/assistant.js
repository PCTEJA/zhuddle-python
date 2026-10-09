import { useEffect, useState } from 'react';

export async function askAssistant(body, signal) {
  const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(22000)].filter(Boolean)),
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'busy' : 'unavailable');
  const answer = await response.json();
  if (answer.provider !== 'groq') throw new Error('unavailable');
  if (body.mode === 'review' && (typeof answer.summary !== 'string' || !Array.isArray(answer.diagnostics))) throw new Error('unavailable');
  if (body.mode === 'guide' && typeof answer.message !== 'string') throw new Error('unavailable');
  return answer;
}

export function localReview(result, hint) {
  const error = result.error || '';
  const explanations = {
    SyntaxError: 'Python could not read this statement. Check matching quotes and brackets, and a colon after if, for, while, or def.',
    IndentationError: 'Python uses indentation to group a block. Keep the lines in this block aligned, usually with four spaces.',
    NameError: 'This name has not been defined. Check its spelling and assign a value before using it.',
    TypeError: 'These values do not work with this operation. Check their types and whether a conversion is needed.',
    ValueError: 'The value is not valid for this operation. Check the input before converting or using it.',
    ZeroDivisionError: 'The divisor became zero. Check that value before dividing.',
    IndexError: 'This position is outside the sequence. Remember that the first position is 0.',
    KeyError: 'This key is missing from the dictionary. Check the available keys before accessing it.',
    EOFError: 'The supplied test input ran out. Check when your input loop should stop.',
  };
  const message = explanations[error.split(':')[0]] || (error ? 'Python stopped here. Read the error in Output, check this statement, and try again.' : '');
  const line = result.errorLine;
  return { provider: 'local', summary: message || hint || 'Your code ran, but a mission check still needs attention. Compare the failed checks below with the task.',
    diagnostics: message && Number.isInteger(line) && line >= 1 && line <= result.source.split('\n').length ? [{ line, message }] : [] };
}

export function useCodeCoach({ chapterId, question, result, enabled }) {
  const [review, setReview] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled || question.kind !== 'code' || !result || result.earned === question.points) { setReview(null); return; }
    const controller = new AbortController();
    let active = true;
    const fallback = localReview(result, question.hint);
    setReview({ ...fallback, result, loading: true });
    askAssistant({ mode: 'review', chapterId, questionId: question.id, code: result.source,
      error: result.error, errorLine: result.errorLine,
      checks: result.checks.map(c => ({ label: c.label, passed: c.earned === c.possible })),
    }, controller.signal).then(answer => {
      if (active) setReview({ ...answer, result, loading: false });
    }).catch(error => {
      if (active) setReview({ ...fallback, result, loading: false, unavailable: error.message });
    });
    return () => { active = false; controller.abort(); };
  }, [chapterId, question.id, result, enabled, retry]);
  return { review: review?.result === result ? review : null, retry: () => setRetry(n => n + 1) };
}
