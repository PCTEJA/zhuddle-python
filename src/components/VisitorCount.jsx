import { useEffect, useRef, useState } from 'react';
import { UsersRound, ArrowUpRight, Leaf } from 'lucide-react';
import '../styles/visitor-count.css';

const number = new Intl.NumberFormat('en-US');
export default function VisitorCount({ endpoint }) {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    async function load() {
      try {
        if (!endpoint) throw new Error('Unavailable');
        const response = await fetch(endpoint, { signal: controller.signal, credentials: 'omit' });
        if (!response.ok) throw new Error('Unavailable');
        const value = await response.json();
        if (!Number.isSafeInteger(value.total) || value.total < 0 ||
            !Number.isFinite(Date.parse(value.since)) || !Number.isFinite(Date.parse(value.updatedAt))) throw new Error('Invalid count');
        setStats(value);
        setStatus('ready');
      } catch { setStatus('unavailable'); }
      finally { clearTimeout(timer); }
    }
    load();
    return () => { clearTimeout(timer); controller.abort(); };
  }, [endpoint]);
  useEffect(() => {
    function dismiss(event) {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && root.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss); };
  }, []);
  const total = stats ? number.format(stats.total) : '—';
  const since = stats && new Date(stats.since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' });
  const stale = stats && Date.now() - Date.parse(stats.updatedAt) > 3_600_000;
  return <aside className="visitor-count" ref={root} aria-label="ZHUDDLE visits"
    onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') setOpen(false); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button className="visitor-count-pill" aria-expanded={open} aria-controls="visitor-count-details"
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setOpen(true); }} onClick={() => setOpen(value => !value)}>
      <span className="visitor-count-icon"><UsersRound size={18} aria-hidden="true" /></span>
      <span className="visitor-count-copy"><strong aria-live="polite">{total}</strong><span>All-time visits</span></span>
      <ArrowUpRight className="visitor-count-arrow" size={14} aria-hidden="true" />
    </button>
    <div className="visitor-count-details" id="visitor-count-details" hidden={!open}>
      <span className="visitor-count-eyebrow"><Leaf size={13} aria-hidden="true" /> OUR LEARNING COMMUNITY</span>
      <h2>Every visit is a little spark.</h2>
      <p className="visitor-count-total">{total}<span>total visits to ZHUDDLE</span></p>
      <p>{status === 'loading' ? 'Checking the latest count…' : status === 'unavailable' ? 'The visit count is temporarily unavailable. Please check back soon.' : `Counting since ${since}. Return visits are included; this is not a count of unique people.`}</p>
      {stats && <div className="visitor-count-note"><span className={`status-dot${stale ? ' muted' : ''}`} aria-hidden="true" />
        {stale ? 'Last saved count · updates delayed' : 'Updated periodically · powered by Cloudflare'}
      </div>}
    </div>
  </aside>;
}
