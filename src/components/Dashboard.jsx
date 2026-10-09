import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Download,
  FileCode2,
  Flag,
  Menu,
  Search,
  X,
} from "lucide-react";
import Art from "./MotionArt";
import BannerMedia from "./BannerMedia";
import ChapterSelect from "./ChapterSelect";
import { currentResult } from "../lib/progress";

const badges = [
  { name: "badge-function", label: "Function Starter", at: 0 },
  { name: "badge-loop", label: "Function Explorer", at: 50 },
  { name: "badge-list", label: "Function Builder", at: 75 },
  { name: "badge-python", label: "Function Champion", at: 100 },
];

export function Header({
  ready,
  view,
  setView,
  state,
  score,
  openProfile,
  menu,
  setMenu,
  questions,
  selectQuestion,
}) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const matches = questions.filter((q) =>
    (q.title + " " + q.task).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={() => setView("quest")}
        aria-label="ZHUDDLE home"
      >
        <Art name="logo" mode="still" eager />
        <span>
          ZHUDDLE<span className="brand-dot">.</span>
        </span>
      </button>
      <nav className="topnav" aria-label="Main navigation">
        <button
          className={view === "quest" ? "selected" : ""}
          aria-current={view === "quest" ? "page" : undefined}
          onClick={() => setView("quest")}
        >
          <Art name="learning-book" />
          Learn
        </button>
        <button
          onClick={() =>
            selectQuestion(
              questions.find(
                (q) =>
                  q.kind === "code" &&
                  currentResult(state, q)?.earned !== q.points,
              )?.id || "C01",
            )
          }
        >
          <Art name="practice-lightning" />
          Practice
        </button>
        <button
          className={view === "results" ? "selected" : ""}
          aria-current={view === "results" ? "page" : undefined}
          onClick={() => setView("results")}
        >
          <Award size={21} />
          Achievements
        </button>
        <button
          className={view === "explore" ? "selected" : ""}
          aria-current={view === "explore" ? "page" : undefined}
          onClick={() => setView("explore")}
        >
          <Art name="explore-compass" />
          Explore
        </button>
      </nav>
      <div
        className="search-wrap"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setSearchOpen(false);
        }}
      >
        <Search size={18} />
        <input
          type="search"
          aria-label="Search lessons"
          placeholder="Find your next little win…"
          value={search}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSearchOpen(false);
          }}
        />
        {searchOpen && search.trim() && (
          <div className="search-results">
            <small>LESSONS & KNOWLEDGE CHECKS</small>
            {matches.length ? (
              matches.slice(0, 6).map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    selectQuestion(q.id);
                    setSearch("");
                    setSearchOpen(false);
                  }}
                >
                  <Code2 size={16} />
                  <span>
                    {q.title}
                    <small>
                      {q.kind === "code" ? "Coding mission" : "Knowledge check"}{" "}
                      · {q.points} XP
                    </small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))
            ) : (
              <p>No lessons found in this chapter. Try a different topic.</p>
            )}
          </div>
        )}
      </div>
      <div className="top-actions">
        <span className="xp-pill">
          <Art name="streak-flame" mode="still" eager />
          <span>
            <small>Keep your spark</small>
            {score} XP
          </span>
        </span>
        <button
          className="profile-button"
          onClick={openProfile}
          aria-label="Student profile"
        >
          <Art name="thinking-learner" mode="still" eager />
          <span>
            {state.student.name
              ? state.student.name.split(" ")[0]
              : "Your profile"}
          </span>
          <ChevronDown size={15} />
        </button>
        <button
          className="icon-button mobile-menu"
          disabled={!ready}
          aria-label={menu ? "Close course menu" : "Open course menu"}
          aria-expanded={menu}
          aria-controls="course-sidebar"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

export function Sidebar({
  chapter,
  chapters,
  selectChapter,
  chapterSelectionDisabled,
  state,
  questions,
  complete,
  score,
  view,
  selectQuestion,
  setView,
  setMenu,
  menu,
}) {
  const panel = useRef(null);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    const handleKey = (e) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setMenu(false);
      }
      if (e.key === "Tab") {
        const items = [
          ...panel.current.querySelectorAll("button:not([tabindex='-1']),a[href]"),
        ].filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    const wide = matchMedia("(min-width:701px)");
    const closeWide = () => {
      if (wide.matches) setMenu(false);
    };
    wide.addEventListener("change", closeWide);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener("keydown", handleKey);
      wide.removeEventListener("change", closeWide);
      previous?.focus();
    };
  }, [menu, setMenu]);
  const code = questions.filter((q) => q.kind === "code"),
    mcq = questions.filter((q) => q.kind === "mcq");
  return (
    <aside
      ref={panel}
      id="course-sidebar"
      className={`sidebar ${menu ? "open" : ""}`}
      aria-label="Course navigation"
      role={menu ? "dialog" : undefined}
      aria-modal={menu ? true : undefined}
    >
      <div className="mobile-course-nav">
        <button
          className="mobile-close"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X size={18} />
        </button>
        <nav aria-label="Mobile navigation">
          <button
            onClick={() => {
              setView("quest");
              setMenu(false);
            }}
          >
            Learn
          </button>
          <button
            onClick={() => {
              setView("results");
              setMenu(false);
            }}
          >
            Achievements
          </button>
          <button
            onClick={() => {
              setView("explore");
              setMenu(false);
            }}
          >
            Explore
          </button>
        </nav>
      </div>
      <section className="course-card">
        <div className="course-title">
          <span className="python-mark">
            <Code2 size={25} />
          </span>
          <div>
            <h2>Python foundations</h2>
            <p>Big ideas. Small steps.</p>
          </div>
        </div>
        <div className="sidebar-progress">
          <span>
            {complete} / {questions.length} lessons checked
          </span>
          <b>{Math.round((complete / questions.length) * 100)}%</b>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Course completion"
          aria-valuenow={complete}
          aria-valuemin={0}
          aria-valuemax={questions.length}
        >
          <span style={{ width: `${(complete / questions.length) * 100}%` }} />
        </div>
      </section>
      <section className="path-card">
        <ChapterSelect chapter={chapter} chapters={chapters} onSelect={selectChapter}
          disabled={chapterSelectionDisabled} sidebarOpen={menu} />
        <nav aria-label="Coding missions" className="mission-list">
          {code.map((item, index) => {
            const mastered = currentResult(state, item)?.earned === item.points,
              active = state.active === item.id && view === "quest";
            return (
              <button
                key={item.id}
                aria-current={active ? "step" : undefined}
                className={`${active ? "active" : ""} ${mastered ? "mastered" : ""}`}
                onClick={() => selectQuestion(item.id)}
              >
                <span className="mission-number">
                  {mastered ? (
                    <Check size={16} />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <span>
                  {item.title}
                  <small>
                    {item.level} <span>·</span> {item.points} XP
                  </small>
                </span>
                {active && <ChevronRight size={15} />}
              </button>
            );
          })}
        </nav>
        <div className="path-group">
          <span>
            <BookOpen size={15} />
            Knowledge check
          </span>
          <small>20 XP</small>
        </div>
        <nav className="mcq-grid" aria-label="Knowledge checks">
          {mcq.map((q, index) => (
            <button
              key={q.id}
              title={q.title}
              aria-label={`Knowledge check ${index + 1}: ${q.title}`}
              aria-current={
                state.active === q.id && view === "quest" ? "step" : undefined
              }
              className={`${state.active === q.id && view === "quest" ? "active" : ""} ${currentResult(state, q)?.earned === q.points ? "mastered" : ""}`}
              onClick={() => selectQuestion(q.id)}
            >
              {currentResult(state, q)?.earned === q.points ? (
                <Check size={14} />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </nav>
      </section>
      <button
        className="finish-link"
        onClick={() => {
          setView("results");
          setMenu(false);
        }}
      >
        <Award size={23} />
        <span>
          Your finish line<small>{score} / 100 XP earned</small>
        </span>
        <ChevronRight size={17} />
      </button>
      <div className="sidebar-bottom">
        <a href={chapter.source} target="_blank" rel="noreferrer">
          <BookOpen size={16} />
          Read the chapter
          <ArrowUpRight size={14} />
        </a>
        <a href={chapter.notebook} download>
          <FileCode2 size={16} />
          Offline notebook
          <Download size={14} />
        </a>
      </div>
      <div className="sidebar-signoff">
        <span className="status-dot" />A good day to learn something.
      </div>
    </aside>
  );
}

export function Welcome({ state, score, complete, mastered, view, chapter }) {
  const first = state.student.name.split(" ")[0];
  return (
    <section className="welcome-band welcome-band-compact">
      <BannerMedia />
      <div className="welcome-copy">
        <div className="eyebrow">
          <span className="status-dot" />
          CHAPTER {chapter.number} · {chapter.fullTitle.toUpperCase()}
        </div>
        <h1>
          {view === "results" ? (
            <>
              Small steps.
              <span>Look how far you’ve come.</span>
            </>
          ) : (
            <>
              Keep going{first ? `, ${first}` : ""}
              <span className="hero-period">.</span>
              <span>You’re building something great.</span>
            </>
          )}
        </h1>
        <p>A little curiosity. A little code. A new superpower.</p>
        <div className="hero-stats">
          <div>
            <Art name="xp-star" mode="still" eager />
            <span>
              <b>
                {score}
                <em> / 100</em>
              </b>
              <small>Chapter XP</small>
            </span>
          </div>
          <div>
            <Art name="goal-target" mode="still" eager />
            <span>
              <b>
                {complete}
                <em> / 18</em>
              </b>
              <small>Lessons checked</small>
            </span>
          </div>
          <div>
            <Art name="badge-function" mode="still" eager />
            <span>
              <b>{mastered}</b>
              <small>Lessons mastered</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BadgeCollection({ score, chapter, expanded = false }) {
  return (
    <div className={`badge-collection ${expanded ? "expanded" : ""}`}>
      {badges.map((b) => (
        <div
          className={`badge-item ${score >= b.at ? "earned" : "locked"}`}
          key={b.name}
        >
          <Art
            name={score >= b.at ? b.name : "badge-locked"}
            mode={score >= b.at ? "hover" : "still"}
          />
          <strong>{b.label.replace('Function', chapter?.id === 'functions' ? 'Function' : chapter?.title || 'Chapter')}</strong>
          <small>{score >= b.at ? "Unlocked" : `${b.at} XP`}</small>
        </div>
      ))}
    </div>
  );
}

export function ProgressRail({
  chapter,
  state,
  questions,
  score,
  mastered,
  complete,
  selectQuestion,
  setView,
}) {
  const goals = [
    { label: "Check your first lesson", done: complete >= 1 },
    {
      label: "Master a coding mission",
      done: questions.some(
        (q) =>
          q.kind === "code" && currentResult(state, q)?.earned === q.points,
      ),
    },
    { label: "Get 2 answers correct", done: mastered >= 2 },
    {
      label: chapter.id === 'functions' ? 'Try the random-number lab' : `Try ${questions[1].title.toLowerCase()}`,
      done: !!currentResult(
        state,
        questions.find((q) => q.id === "C02"),
      ),
    },
  ];
  const done = goals.filter((g) => g.done).length;
  return (
    <aside className="progress-rail" aria-label="Learning progress">
      <section className="rail-card goals-card">
        <div className="rail-title">
          <Art name="goal-target" />
          <h2>Your next wins</h2>
          <span className="count-pill">{done}/4</span>
        </div>
        <p className="card-subtitle">A little momentum goes a long way.</p>
        <ul className="goal-list">
          {goals.map((g) => (
            <li key={g.label}>
              <span className={`goal-check ${g.done ? "done" : ""}`}>
                {g.done && <Check size={14} />}
              </span>
              <span>{g.label}</span>
              {g.done && <span className="goal-done">Done</span>}
            </li>
          ))}
        </ul>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Learning goals"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={4}
        >
          <span style={{ width: `${(done / 4) * 100}%` }} />
        </div>
        <small className="goal-caption">
          {done === 4
            ? "All four wins. Nicely done!"
            : "You’ve got this. One step at a time."}
        </small>
      </section>
      <section className="rail-card">
        <div className="rail-title">
          <Award className="gold-icon" size={23} />
          <h2>Badge collection</h2>
          <button
            aria-label="View all achievements"
            onClick={() => setView("results")}
          >
            <ArrowRight size={17} />
          </button>
        </div>
        <BadgeCollection score={score} chapter={chapter} />
        <p className="badge-caption">Small wins. Something to be proud of.</p>
      </section>
      <section className="rail-card challenge-card">
        <div className="rail-title">
          <Flag size={20} />
          <h2>A little adventure</h2>
          <span className="tag points">10 XP</span>
        </div>
        <button
          className="challenge-art"
          aria-label={`Open ${questions[1].title}`}
          onClick={() => selectQuestion("C02")}
        >
          <BannerMedia
            src="/assets/zhuddle/snake-adventure-v2.mp4"
            poster="/assets/zhuddle/python-challenge-still.svg"
            imageClassName="challenge-poster"
            videoClassName="challenge-video"
            imageProps={{ loading: "lazy", width: 1500, height: 1000 }}
          />
        </button>
        <div className="challenge-copy">
          <span className="eyebrow">YOUR NEXT CHALLENGE</span>
          <h3>Let curiosity take the lead.</h3>
          <p>
            {chapter.id === 'functions' ? 'Explore random numbers. Run it twice. See what changes.' : `Practice ${chapter.title.toLowerCase()} with ${questions[1].title.toLowerCase()}. Read the feedback, then try again.`}
          </p>
          <button
            className="primary-button full"
            onClick={() => selectQuestion("C02")}
          >
            {chapter.id === 'functions' ? 'Try the random-number lab' : 'Try this chapter’s challenge'}
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
      <section className="little-note">
        <Art name="learning-book" mode="still" />
        <div>
          <strong>Learn at your own pace.</strong>
          <p>
            No timer. No pressure.
            <br />
            Just you, getting a little better.
          </p>
        </div>
      </section>
    </aside>
  );
}

export function KnowledgeCard({ selectQuestion }) {
  return (
    <section className="knowledge-card">
      <Art name="thinking-learner" />
      <div>
        <span className="eyebrow">PUT YOUR KNOW-HOW TO THE TEST</span>
        <h2>A little knowledge check.</h2>
        <p>
          10 quick questions <span>·</span> 20 XP to discover
        </p>
      </div>
      <button
        className="secondary-button"
        onClick={() => selectQuestion("M01")}
      >
        Let’s try it
        <ArrowRight size={17} />
      </button>
    </section>
  );
}

export function Explore({ selectQuestion, chapter }) {
  return (
    <section className="explore-surface">
      <div className="section-intro">
        <Art name="explore-compass" mode="event" />
        <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
        <h2>There’s always more to discover.</h2>
        <p>Go deeper, experiment, or take your learning offline.</p>
      </div>
      <div className="explore-grid">
        <a
          className="resource-card"
          href={chapter.source}
          target="_blank"
          rel="noreferrer"
        >
          <Art name="learning-book" />
          <h3>The story behind {chapter.title.toLowerCase()}</h3>
          <p>
            Explore the original Python for Everybody chapter, with examples and
            explanations.
          </p>
          <span>
            Read the chapter
            <ArrowUpRight size={16} />
          </span>
        </a>
        <button className="resource-card" onClick={() => selectQuestion("C02")}>
          <Art name="python-challenge" />
          <h3>{chapter.id === 'functions' ? 'A little unpredictability' : chapter.questions[1].title}</h3>
          <p>
            {chapter.id === 'functions' ? 'Meet Python’s random module and find out why the same code can surprise you.' : `Apply this chapter’s concepts in a coding mission with five checks and helpful feedback.`}
          </p>
          <span>
            Open the lab
            <ArrowRight size={16} />
          </span>
        </button>
        <a
          className="resource-card"
          href={chapter.notebook}
          download
        >
          <Art name="loading-code" />
          <h3>Your portable playground</h3>
          <p>
            All 18 exercises in one notebook. Keep experimenting wherever you
            like to code.
          </p>
          <span>
            Download notebook
            <Download size={16} />
          </span>
        </a>
      </div>
    </section>
  );
}
