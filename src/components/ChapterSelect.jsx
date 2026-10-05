import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Code2 } from 'lucide-react';

export default function ChapterSelect({ chapter, chapters, onSelect, disabled, sidebarOpen }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ above: false, maxHeight: 440 });
  const container = useRef(null);
  const trigger = useRef(null);
  const options = useRef([]);
  const search = useRef({ text: '', time: 0 });
  const selectedIndex = chapters.findIndex(item => item.id === chapter.id);

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }

  function focusOption(index) {
    const option = options.current[(index + chapters.length) % chapters.length];
    option?.focus({ preventScroll: true });
    option?.scrollIntoView({ block: 'nearest' });
  }

  // Constrain the overlay to the visible viewport, including the mobile drawer.
  // Prefer below; a short viewport can place the menu above the trigger.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = trigger.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
      const headerBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0;
      if (rect.bottom <= Math.max(viewportTop, headerBottom) || rect.top >= viewportBottom) {
        setOpen(false);
        return;
      }
      const below = Math.max(0, viewportBottom - rect.bottom - 12);
      const above = Math.max(0, rect.top - Math.max(viewportTop, headerBottom) - 12);
      const useAbove = below < 180 && above > below;
      const maxHeight = Math.min(440, useAbove ? above : below);
      setPosition(old => old.above === useAbove && old.maxHeight === maxHeight ? old : { above: useAbove, maxHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    search.current = { text: '', time: 0 };
    focusOption(selectedIndex);
    const outside = event => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, selectedIndex]);

  // A closed mobile drawer must never retain an open popup when reopened.
  useEffect(() => { setOpen(false); }, [sidebarOpen]);

  function onKeyDown(event) {
    const index = options.current.indexOf(document.activeElement);
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); focusOption(index + 1); break;
      case 'ArrowUp': event.preventDefault(); focusOption(index - 1); break;
      case 'Home': event.preventDefault(); focusOption(0); break;
      case 'End': event.preventDefault(); focusOption(chapters.length - 1); break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        close(true);
        break;
      case 'Tab':
        // Return to the trigger before normal tabbing continues into the page.
        close(true);
        break;
      default:
        if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          const now = Date.now();
          const text = (now - search.current.time < 700 ? search.current.text : '') + event.key.toLowerCase();
          search.current = { text, time: now };
          const match = chapters.findIndex(item => item.title.toLowerCase().startsWith(text) || item.number.startsWith(text));
          if (match >= 0) focusOption(match);
        }
    }
  }

  return (
    <div className="chapter-select" ref={container}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button id="chapter-selector" className="chapter-heading chapter-trigger" ref={trigger}
        type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
        aria-controls={open ? 'chapter-options' : undefined}
        aria-label={`Choose chapter. Current: Chapter ${chapter.number} — ${chapter.title}`}
        onClick={() => setOpen(value => !value)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); }
          if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(true); }
        }}>
        <span className="chapter-symbol" aria-hidden="true"><Code2 size={23} /></span>
        <span className="chapter-label"><small>CHAPTER {chapter.number}</small><strong>{chapter.title}</strong></span>
        <ChevronDown className={`chapter-chevron ${open ? 'is-open' : ''}`} size={19} aria-hidden="true" />
      </button>
      {open && (
        <div id="chapter-options" className={`chapter-options ${position.above ? 'above' : ''}`}
          role="listbox" aria-label="Chapters" style={{ maxHeight: position.maxHeight }} onKeyDown={onKeyDown}>
          {chapters.map((item, index) => (
            <button key={item.id} ref={node => { options.current[index] = node; }} type="button"
              role="option" tabIndex={-1} aria-selected={item.id === chapter.id}
              aria-label={`Chapter ${item.number}: ${item.title}`}
              className="chapter-menu-option"
              onClick={() => { close(); onSelect(item.id); }}>
              <span><small>CHAPTER {item.number}</small><strong>{item.title}</strong></span>
              {item.id === chapter.id && <Check size={19} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
