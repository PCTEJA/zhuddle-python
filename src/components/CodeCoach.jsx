import { Sparkles, ArrowUpRight, LoaderCircle, RotateCcw } from 'lucide-react';

export default function CodeCoach({ review, enabled, onToggle, onRetry, onLine }) {
  return <section className={`code-coach ${review ? 'has-review' : ''}`} aria-label="Code Coach">
    <div className="coach-heading">
      <span className="coach-symbol"><Sparkles size={16} /></span>
      <strong>Code Coach</strong><span className="coach-tag">{review?.provider === 'groq' ? 'AI · GROQ' : 'A LITTLE GUIDANCE'}</span>
      <button className="coach-toggle" role="switch" aria-checked={enabled} aria-label="Automatic AI code help" onClick={onToggle}><span />{enabled ? 'On' : 'Off'}</button>
    </div>
    <div aria-live="polite" aria-atomic="true">
      {review ? <>
        <p className="coach-summary">{review.summary}</p>
        <div className="coach-diagnostics">{review.diagnostics.map((item, index) => <button key={index} onClick={() => onLine({ line: item.line, nonce: Date.now() })}>
          <span className="coach-line">L{item.line}</span><span>{item.message}</span><ArrowUpRight size={15} />
        </button>)}</div>
        <div className="coach-footnote">{review.loading ? <><LoaderCircle size={13} className="spin" />Finding a helpful next step…</> : review.unavailable ? <><span>{review.unavailable === 'busy' ? 'AI is busy. Built-in guidance is ready.' : 'AI is unavailable. Built-in guidance is ready.'}</span><button onClick={onRetry}><RotateCcw size={12} />Retry AI</button></> : <span>{review.provider === 'groq' ? 'AI suggestions may be imperfect. Your Python checks decide XP.' : 'Built-in Python guidance.'}</span>}</div>
      </> : <p className="coach-intro">{enabled ? 'Stuck after a check? I’ll help you spot the next small fix.' : 'Automatic AI help is paused. Your Python checks still work.'}</p>}
    </div>
    {enabled && <p className="coach-privacy">Failed code and check details are sent to Groq for help. Keep personal details out of your code.</p>}
  </section>;
}
