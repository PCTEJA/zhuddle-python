import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, Compass, Send, Sparkles, X, LoaderCircle } from 'lucide-react';
import { guideTopics, localGuide } from '../lib/assistant-knowledge';
import { askAssistant } from '../lib/assistant';

const tourSteps = [
  { action: 'profile', title: 'Make yourself at home', text: 'Add your name and UNT ID here before your first check. Your profile stays in this browser.' },
  { action: 'chapters', title: 'Choose your next little win', text: 'Pick any of the seven chapters in the course sidebar. On a phone, open this menu to find the chapter selector.' },
  { action: 'mission', title: 'One small mission at a time', text: 'Read the task, then try the helpful little nudge if you need a starting point. Every retry is part of learning.' },
  { action: 'editor', title: 'Try it. Check it. Let it click.', text: 'Write Python and select Run & check. Code Coach marks helpful lines after a failed check. Edit your code and run again.' },
  { action: 'downloads', title: 'Take your progress with you', text: 'Download your notebook and grade report here. Check all 18 current answers in a chapter to unlock its certificate.' },
];

export default function AssistantGuide({ chapterId, prepareTarget, ready }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tour, setTour] = useState(null);
  const [rect, setRect] = useState(null);
  const launcher = useRef(null), input = useRef(null), bottom = useRef(null), controller = useRef(null), tourCard = useRef(null);
  const opened = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (open) { opened.current = true; input.current?.focus(); }
    else if (!tour && opened.current) launcher.current?.focus();
  }, [open, tour]);
  useEffect(() => { if (open) bottom.current?.scrollIntoView({ block: 'nearest' }); }, [messages, busy, open]);
  function close() { controller.current?.abort(); setBusy(false); setOpen(false); }
  function stopTour() { setTour(null); setRect(null); setOpen(true); }
  useEffect(() => {
    if (!open && !tour) return;
    const onKey = event => { if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); tour ? stopTour() : close(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, tour]);
  useEffect(() => {
    if (!tour) return;
    setRect(null);
    const step = tour.single || tourSteps[tour.index];
    const selector = prepareTarget(step.action);
    let element, frame, observer, mutations;
    const measure = () => {
      const box = element?.getBoundingClientRect();
      if (box?.width && box?.height) setRect({ top: Math.max(4, box.top - 6), left: Math.max(4, box.left - 6), width: Math.min(box.width + 12, innerWidth - 8), height: Math.min(box.height + 12, innerHeight - 12) });
    };
    const locate = () => {
      element = document.querySelector(selector);
      if (!element) return;
      mutations?.disconnect();
      element?.scrollIntoView({ block: 'center', behavior: 'instant' });
      measure();
      observer = new ResizeObserver(measure);
      if (element) observer.observe(element);
      tourCard.current?.focus({ preventScroll: true });
    };
    // The parent may still be rendering the destination view when this effect runs.
    mutations = new MutationObserver(() => { if (!element) locate(); });
    mutations.observe(document.getElementById('workspace'), { childList: true, subtree: true });
    frame = requestAnimationFrame(locate);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { cancelAnimationFrame(frame); mutations?.disconnect(); observer?.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [tour]);
  function show(action, text, title) {
    setOpen(false);
    setTour({ single: { action, text, title } });
  }
  async function send(event, suggested) {
    event?.preventDefault();
    const question = (suggested || draft).trim();
    if (!question || busy) return;
    const history = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));
    setMessages(items => [...items.slice(-19), { role: 'user', text: question }]);
    setDraft(''); setBusy(true);
    const request = new AbortController(); controller.current = request;
    try {
      const answer = await askAssistant({ mode: 'guide', chapterId, message: question, history }, request.signal);
      if (!request.signal.aborted) setMessages(items => [...items, { ...answer, role: 'assistant', text: answer.message }]);
    } catch (error) {
      if (!request.signal.aborted) {
        const answer = localGuide(question);
        setMessages(items => [...items, { ...answer, role: 'assistant', text: answer.message, fallback: true }]);
      }
    } finally { if (controller.current === request) setBusy(false); }
  }
  const currentStep = tour && (tour.single || tourSteps[tour.index]);
  return <>
    <button ref={launcher} disabled={!ready} className={`guide-launcher ${open || tour ? 'guide-launcher-hidden' : ''}`} aria-label="Open Zhuddle Guide" aria-expanded={open} aria-controls="zhuddle-guide" onClick={() => setOpen(true)}>
      <img src="/assets/zhuddle/guide-spark.svg" width="36" height="36" alt="" /><span>Need a little guidance?<strong>Ask Zhuddle</strong></span><Sparkles size={17} />
    </button>
    {open && <section id="zhuddle-guide" className="guide-panel" role="dialog" aria-modal="false" aria-labelledby="guide-title">
      <header className="guide-header"><img src="/assets/zhuddle/guide-spark.svg" width="44" height="44" alt="" /><div><h2 id="guide-title">Zhuddle Guide<span>✦</span></h2><p>A little help. A clearer next step.</p></div><button aria-label="Close Zhuddle Guide" className="guide-close" onClick={close}><X size={19} /></button></header>
      <div className="guide-body">
        <div className="guide-welcome"><span className="eyebrow">YOUR LEARNING SIDEKICK</span><h3>Let’s find your way.</h3><p>From your first line of Python to your next little win. What would help?</p>
          <button className="guide-tour-button" onClick={() => { setOpen(false); setTour({ index: 0 }); }}><Compass size={20} /><span>Show me around<small>A quick, five-stop tour</small></span><ArrowRight size={18} /></button>
        </div>
        <div className="guide-topics">{guideTopics.slice(1, 5).map(topic => <button disabled={busy} key={topic.id} onClick={e => send(e, topic.question)}>{topic.title}<ArrowRight size={13} /></button>)}</div>
        <div className="guide-messages" role="log" aria-label="Guide conversation" aria-live="polite" aria-relevant="additions">
          {messages.map((message, index) => <div key={index} className={`guide-message ${message.role}`}><small>{message.role === 'user' ? 'YOU' : message.provider === 'groq' ? 'ZHUDDLE GUIDE · AI' : 'ZHUDDLE GUIDE · BUILT-IN HELP'}</small><p>{message.text}</p>
            {message.role === 'assistant' && guideTopics.some(t => t.action === message.action) && <button onClick={() => show(message.action, message.text, message.label || 'Here’s where to look')}>{message.label || 'Show me where'}<ArrowRight size={14} /></button>}
            {message.fallback && <span className="guide-fallback">AI is unavailable, so here’s our platform guide.</span>}
          </div>)}
          {busy && <div className="guide-thinking" role="status"><LoaderCircle size={15} className="spin" />Finding your next step…</div>}
          <div ref={bottom} />
        </div>
      </div>
      <form className="guide-compose" onSubmit={send}><label className="sr-only" htmlFor="guide-question">Ask about Zhuddle</label><input id="guide-question" ref={input} maxLength={800} value={draft} onChange={e => setDraft(e.target.value)} placeholder="How do I…" autoComplete="off" /><button type="submit" disabled={busy || !draft.trim()} aria-label="Send question"><Send size={17} /></button></form>
      <p className="guide-disclosure">AI by Groq · Questions are sent to Groq. Keep personal details out. AI can make mistakes.</p>
    </section>}
    {tour && <>
      {rect && <div className="guide-spotlight" style={rect} aria-hidden="true" />}
      <section ref={tourCard} tabIndex={-1} className="guide-tour-card" role="dialog" aria-modal="false" aria-labelledby="tour-title">
        <div className="guide-tour-top"><span><Compass size={15} />{tour.single ? 'RIGHT THIS WAY' : `YOUR ZHUDDLE TOUR · ${tour.index + 1} OF ${tourSteps.length}`}</span><button aria-label="Close guided tour" onClick={stopTour}><X size={18} /></button></div>
        <h3 id="tour-title">{currentStep.title}</h3><p>{currentStep.text}</p>
        <div className="guide-tour-actions">{!tour.single && <><div className="guide-tour-dots">{tourSteps.map((_, i) => <span key={i} className={tour.index === i ? 'active' : ''} />)}</div><button disabled={tour.index === 0} onClick={() => setTour({ index: tour.index - 1 })}><ChevronLeft size={16} />Back</button></>}
          <button className="guide-next" onClick={() => tour.single || tour.index === tourSteps.length - 1 ? stopTour() : setTour({ index: tour.index + 1 })}>{tour.single ? 'Got it' : tour.index === tourSteps.length - 1 ? 'Ready to explore' : 'Next'}<ArrowRight size={15} /></button>
        </div>
      </section>
    </>}
  </>;
}
