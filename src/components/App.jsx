import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import {
  Flame,
  Code2,
  BookOpen,
  Check,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  Download,
  Award,
  ArrowUpRight,
  Lightbulb,
  Terminal,
  CheckCircle2,
  UserRound,
  X,
  LoaderCircle,
  Square,
  LockKeyhole,
  FileCode2,
} from "lucide-react";
import Markdown from "react-markdown";
import Art, { MotionContext } from "./MotionArt";
import {
  Header,
  Sidebar,
  Welcome,
  ProgressRail,
  KnowledgeCard,
  BadgeCollection,
  Explore,
} from "./Dashboard";
import { chapters, functionsChapter, chapterKey, PROFILE_KEY, ACTIVE_CHAPTER_KEY } from "../data/curriculum";
import { restoreChapter } from "../lib/chapter-storage";
import {
  freshState,
  scoreState,
  currentResult,
  gradeFor,
  downloadBlob,
  submissionNotebook,
} from "../lib/progress";

const Editor = lazy(() => import("./Editor"));
export default function App() {
  const [chapterId, setChapterId] = useState('functions');
  const [startAtFirst, setStartAtFirst] = useState(false);
  const [ready, setReady] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    try {
      const selected = localStorage.getItem(ACTIVE_CHAPTER_KEY);
      if (chapters.some(c => c.id === selected)) setChapterId(selected);
    } catch { /* Chapter view handles unavailable storage. */ }
    setReady(true);
  }, []);
  function selectChapter(id) {
    setChapterId(id);
    setStartAtFirst(true);
    // Remount even when reselecting the current chapter to open its first lesson.
    setGeneration(value => value + 1);
    try { localStorage.setItem(ACTIVE_CHAPTER_KEY, id); } catch {}
  }
  function resetStudent() {
    try {
      for (const chapter of chapters) localStorage.removeItem(chapterKey(chapter));
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      throw new Error('Saved progress could not be cleared. Clear this site’s browser storage before sharing this device.');
    }
    setGeneration(value => value + 1);
  }
  const chapter = chapters.find(c => c.id === chapterId) || functionsChapter;
  if (!ready) return <main className="app-loading" aria-busy="true">Opening your chapters…</main>;
  return <ChapterApp key={`${chapter.id}-${generation}`} {...{ chapter, startAtFirst, selectChapter, resetStudent }} />;
}

function ChapterApp({ chapter, startAtFirst, selectChapter, resetStudent }) {
  const questions = chapter.questions;
  const SOURCE = chapter.source;
  const [state, setState] = useState(() => freshState(questions));
  const [loaded, setLoaded] = useState(false),
    [storageError, setStorageError] = useState("");
  const [view, setView] = useState("quest"),
    [menu, setMenu] = useState(false),
    [hint, setHint] = useState(false);
  const [profile, setProfile] = useState(false),
    [identity, setIdentity] = useState({ name: "", untId: "" });
  const [busy, setBusy] = useState(false),
    [pythonStatus, setPythonStatus] = useState("idle"),
    [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false),
    [resetQuestion, setResetQuestion] = useState(false),
    [newStudent, setNewStudent] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [exporting, setExporting] = useState(false),
    [reducedMotion, setReducedMotion] = useState(true);
  const worker = useRef(null),
    preserveUnreadable = useRef(false),
    timer = useRef(null),
    pending = useRef(null),
    request = useRef(0),
    dialog = useRef(null),
    returnFocus = useRef(null);
  const q = questions.find((q) => q.id === state.active) || questions[0];
  const result = currentResult(state, q),
    { score, complete, mastered } = scoreState(state, questions);
  const needsIdentity = !state.student.name || !state.student.untId;
  const allDone = complete === questions.length;

  useEffect(() => {
    let restored = freshState(questions);
    try {
      const saved = JSON.parse(localStorage.getItem(chapterKey(chapter)) || "null");
      restored = restoreChapter(saved, questions);
    } catch {
      preserveUnreadable.current = true;
      setStorageError('Saved progress could not be opened. The original entry has been preserved. Download new work before leaving.');
    }
    try {
      const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      if (typeof profile?.name === 'string' && typeof profile?.untId === 'string') restored.student = profile;
      else if (restored.student.name) localStorage.setItem(PROFILE_KEY, JSON.stringify(restored.student));
    } catch {
      setStorageError('The shared profile could not be saved or opened. Chapter answers are still available; download your work before leaving.');
    }
    if (startAtFirst) restored.active = questions[0].id;
    setState(restored);
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      let paused = false;
      try {
        paused = localStorage.getItem("zhuddle-motion") === "off";
      } catch {}
      setSystemReduced(preference.matches);
      setReducedMotion(preference.matches || paused);
    };
    syncMotion();
    preference.addEventListener("change", syncMotion);
    setLoaded(true);
    return () => {
      worker.current?.terminate();
      clearTimeout(timer.current);
      preference.removeEventListener("change", syncMotion);
    };
  }, []);
  useEffect(() => {
    if (loaded && !preserveUnreadable.current) {
      try {
        localStorage.setItem(chapterKey(chapter), JSON.stringify(state));
      } catch {
        setStorageError(
          "This browser cannot save progress. Download your notebook before leaving.",
        );
      }
    }
  }, [state, loaded]);
  useEffect(() => {
    if (loaded && startAtFirst) {
      const target = matchMedia('(max-width: 700px)').matches ? 'workspace' : 'chapter-selector';
      document.getElementById(target)?.focus({ preventScroll: true });
    }
  }, [loaded, startAtFirst]);
  useEffect(() => {
    if (profile || resetQuestion || newStudent) {
      returnFocus.current = document.activeElement;
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      returnFocus.current?.focus?.();
    }
  }, [profile, resetQuestion, newStudent]);

  function toggleMotion() {
    const next = !reducedMotion;
    setReducedMotion(next);
    try {
      localStorage.setItem("zhuddle-motion", next ? "off" : "on");
    } catch {}
  }
  function update(patch) {
    setState((s) => ({ ...s, ...patch }));
  }
  function selectQuestion(id) {
    update({ active: id });
    setView("quest");
    setMenu(false);
    setHint(false);
    setError("");
  }
  function openProfile() {
    setIdentity(state.student);
    setProfile(true);
  }
  function closeDialog() {
    setProfile(false);
    setResetQuestion(false);
    setNewStudent(false);
  }
  function saveIdentity(e) {
    e.preventDefault();
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: identity.name.trim(), untId: identity.untId.trim() })); }
    catch { setStorageError('Your profile could not be saved on this device.'); }
    update({
      student: { name: identity.name.trim(), untId: identity.untId.trim() },
    });
    setProfile(false);
  }
  function storeResult(qid, value) {
    setState((s) => ({
      ...s,
      results: {
        ...s.results,
        [qid]: { ...value, attempts: (s.results[qid]?.attempts || 0) + 1 },
      },
    }));
    if (value.earned > 0) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2800);
    }
  }
  function bootWorker() {
    if (worker.current) return;
    setPythonStatus("loading");
    worker.current = new Worker("/python-worker.js");
    worker.current.onmessage = ({ data }) => {
      if (data.type === "ready") {
        setPythonStatus("ready");
        if (pending.current) {
          const task = pending.current;
          pending.current = null;
          sendCode(task);
        } else clearTimeout(timer.current);
      } else if (data.type === "result" && data.id === request.current && data.chapterId === chapter.id) {
        clearTimeout(timer.current);
        setBusy(false);
        setPythonStatus("ready");
        storeResult(
          data.result.sourceId ||
            pending.current?.qid ||
            worker.current.taskQid,
          data.result,
        );
      } else if (data.type === "error") {
        clearTimeout(timer.current);
        setBusy(false);
        setPythonStatus("error");
        setError(data.message);
        worker.current?.terminate();
        worker.current = null;
        pending.current = null;
      }
    };
    worker.current.onerror = () => {
      setError(
        "Python could not start. Check your internet connection, then run again.",
      );
      stopRun();
    };
    worker.current.postMessage({ type: "init" });
  }
  function sendCode(task) {
    worker.current.taskQid = task.qid;
    worker.current.postMessage({ ...task, type: "run", id: ++request.current });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setError("This run took too long. Check your loop and try again.");
      stopRun();
    }, 10000);
  }
  function stopRun() {
    worker.current?.terminate();
    worker.current = null;
    pending.current = null;
    clearTimeout(timer.current);
    setBusy(false);
    setPythonStatus("idle");
  }
  function runCode() {
    if (needsIdentity) {
      openProfile();
      return;
    }
    const source = state.code[q.id];
    if (source.length > 20000) {
      setError("Keep this answer under 20,000 characters.");
      return;
    }
    setError("");
    setBusy(true);
    const task = { chapterId: chapter.id, qid: q.id, source };
    if (pythonStatus === "ready" && worker.current) {
      sendCode(task);
    } else {
      pending.current = task;
      bootWorker();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setError(
          "Python is taking too long to load. Check your connection and retry.",
        );
        stopRun();
      }, 90000);
    }
  }
  function checkChoice() {
    if (needsIdentity) {
      openProfile();
      return;
    }
    const choice = state.choices[q.id];
    if (!choice) return;
    const earned = choice === q.answer ? 2 : 0;
    storeResult(q.id, {
      source: choice,
      earned,
      possible: 2,
      checks: [
        {
          earned,
          possible: 2,
          label: earned
            ? "Correct. Knowledge key earned. " + (q.explanation || '')
            : "Review the chapter and try another answer. " + (q.explanation || ''),
        },
      ],
      stdout: "",
      error: null,
    });
  }
  async function downloadPdf(certificate) {
    if (needsIdentity) {
      openProfile();
      return;
    }
    setExporting(true);
    setError("");
    try {
      const { exportPdf } = await import("../lib/export-pdf");
      exportPdf(state, questions, certificate, chapter);
    } catch (e) {
      setError(e.message || "The PDF could not be created. Please retry.");
    } finally {
      setExporting(false);
    }
  }
  function downloadNotebook() {
    if (needsIdentity) {
      openProfile();
      return;
    }
    downloadBlob(
      submissionNotebook(state, questions, chapter),
      "application/x-ipynb+json",
      `ZHUDDLE_Chapter_${chapter.number}_${chapter.title}_Submission.ipynb`,
    );
  }
  const navigateNext = () => {
    const i = questions.findIndex((item) => item.id === q.id);
    if (i === questions.length - 1) setView("results");
    else selectQuestion(questions[i + 1].id);
  };

  return (
    <MotionContext.Provider value={reducedMotion}>
      <div className={`app ${reducedMotion ? "reduce-motion" : ""}`}>
        <a className="skip-link" href="#workspace">
          Skip to exercise
        </a>
        <Header
          {...{
            view,
            setView,
            state,
            score,
            openProfile,
            menu,
            setMenu,
            questions,
            selectQuestion,
          }}
        />
        {menu && (
          <button
            className="scrim"
            aria-label="Close course menu"
            onClick={() => setMenu(false)}
          />
        )}
        <div className="dashboard-layout">
          <Sidebar
            chapters={chapters}
            chapterSelectionDisabled={!loaded}
            selectChapter={(id) => { stopRun(); selectChapter(id); }}
            {...{
              chapter,
              state,
              questions,
              complete,
              score,
              view,
              selectQuestion,
              setView,
              setMenu,
              menu,
            }}
          />
          <main id="workspace" className="main" tabIndex={-1}>
            {storageError && (
              <div className="notice error" role="alert">
                {storageError}
              </div>
            )}
            <Welcome {...{ state, score, complete, mastered, view, chapter }} />
            {needsIdentity && (
              <div className="identity-banner">
                <UserRound size={18} />
                <span>Add your name and UNT ID to begin earning XP.</span>
                <button onClick={openProfile}>
                  Join the quest
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            {view === "explore" ? (
              <Explore {...{ selectQuestion, chapter }} />
            ) : view === "quest" ? (
              <section className="quest-surface" key={q.id}>
                <div className="quest-heading">
                  <span className="mission-symbol">
                    <Code2 size={26} />
                  </span>
                  <div>
                    <div className="eyebrow">
                      {q.kind === "code" ? "CODING MISSION" : "KNOWLEDGE KEY"}{" "}
                      {q.id.slice(1)} / {q.kind === "code" ? "08" : "10"}
                    </div>
                    <h2>{q.title}</h2>
                  </div>
                  <div className="mission-tags">
                    <span
                      className={q.level === "Easy" ? "tag easy" : "tag medium"}
                    >
                      {q.level}
                    </span>
                    <span className="tag points">
                      <Flame size={14} />
                      {q.points} XP
                    </span>
                  </div>
                </div>
                <div
                  className={
                    q.kind === "code" ? "coding-layout" : "quiz-layout"
                  }
                >
                  <div className="instructions">
                    <div className="section-heading">
                      <BookOpen size={17} />
                      LET’S MAKE SOMETHING WORK
                    </div>
                    <Markdown>{q.task}</Markdown>
                    {chapter.id === 'functions' && q.kind === "code" && q.id === "C01" && (
                      <div className="example-card">
                        <div>
                          <Code2 size={18} />
                          <strong>A tiny example</strong>
                        </div>
                        <p>
                          A function takes something in, and gives something
                          back.
                        </p>
                        <pre>
                          <code>
                            <span>len</span>("hello") <em># returns 5</em>
                          </code>
                        </pre>
                      </div>
                    )}
                    {q.hint && (
                      <div className={`hint ${hint ? "is-open" : ""}`}>
                        <Art
                          name="helper-robot"
                          mode="idle"
                          className="hint-robot"
                        />
                        <button
                          aria-expanded={hint}
                          onClick={() => setHint(!hint)}
                        >
                          <Lightbulb size={17} />A helpful little nudge
                          <ChevronRight
                            className={hint ? "rotated" : ""}
                            size={16}
                          />
                        </button>
                        {hint && <p>{q.hint}</p>}
                      </div>
                    )}
                    <div className="source-note">
                      <BookOpen size={14} />
                      <span>
                        From PY4E: {q.source}
                        <a href={q.sourceUrl || chapter.reading} target="_blank" rel="noreferrer">
                          Open chapter
                          <ArrowUpRight size={12} />
                        </a>
                      </span>
                    </div>
                    {q.kind === "code" && (
                      <div className="small-encouragement">
                        <Flame size={16} />
                        Every retry is part of learning.
                      </div>
                    )}
                  </div>
                  <div className="answer-area">
                    {q.kind === "code" ? (
                      <>
                        <div className="editor-frame">
                          <div className="editor-topline">
                            <span>
                              <span className="file-dot" />
                              <FileCode2 size={15} />
                              {q.id.toLowerCase()}.py
                            </span>
                            <span>Python 3</span>
                            <button
                              className="icon-button"
                              title="Reset starter code"
                              aria-label="Reset starter code"
                              disabled={busy}
                              onClick={() => setResetQuestion(true)}
                            >
                              <RotateCcw size={15} />
                            </button>
                          </div>
                          <Suspense
                            fallback={
                              <div className="editor-loading">
                                <Art name="loading-code" mode="idle" />
                                Opening your workspace…
                              </div>
                            }
                          >
                            <Editor
                              value={state.code[q.id] || ""}
                              disabled={busy}
                              onChange={(value) =>
                                setState((s) => ({
                                  ...s,
                                  code: { ...s.code, [q.id]: value },
                                }))
                              }
                            />
                          </Suspense>
                          <div className="editor-actions" aria-live="polite">
                            <span>
                              <span
                                className={`status-dot ${pythonStatus === "ready" ? "" : "muted"}`}
                              />
                              {busy
                                ? pythonStatus === "loading"
                                  ? "Warming up Python..."
                                  : "Running your code..."
                                : result
                                  ? "Checked · " + result.earned + "/10 XP"
                                  : state.results[q.id]
                                    ? "Edited · run to update"
                                    : "Ready when you are"}
                            </span>
                            {busy ? (
                              <button className="stop-button" onClick={stopRun}>
                                <Square size={14} />
                                Stop
                              </button>
                            ) : (
                              <button
                                className="run-button"
                                onClick={runCode}
                                disabled={!loaded}
                              >
                                <Play size={16} fill="currentColor" />
                                Run & check
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="console" aria-live="polite">
                          <div className="console-header">
                            <Terminal size={15} />
                            Output
                            <span>
                              {result
                                ? `Attempt ${result.attempts}`
                                : "Awaiting your first run"}
                            </span>
                          </div>
                          <pre>
                            {result?.error ||
                              result?.stdout ||
                              (result
                                ? "Your code ran without printed output."
                                : "Your output will appear here.")}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <div
                        className="choice-list"
                        role="radiogroup"
                        aria-label="Choose an answer"
                      >
                        {q.options.map((option) => (
                          <label
                            key={option.letter}
                            className={`choice ${state.choices[q.id] === option.letter ? "chosen" : ""}`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={state.choices[q.id] === option.letter}
                              onChange={() =>
                                setState((s) => ({
                                  ...s,
                                  choices: {
                                    ...s.choices,
                                    [q.id]: option.letter,
                                  },
                                }))
                              }
                            />
                            <span className="choice-letter">
                              {option.letter}
                            </span>
                            <span>{option.text}</span>
                          </label>
                        ))}
                        <button
                          className="primary-button"
                          disabled={!state.choices[q.id]}
                          onClick={checkChoice}
                        >
                          <CheckCircle2 size={17} />
                          Check answer
                        </button>
                      </div>
                    )}
                    {error && (
                      <div className="notice error" role="alert">
                        {error}
                      </div>
                    )}
                    {result && (
                      <div className="check-results" aria-live="polite">
                        <div className="result-heading">
                          <span>
                            {result.earned === q.points ? (
                              <CheckCircle2 size={19} />
                            ) : (
                              <Lightbulb size={19} />
                            )}{" "}
                            {result.earned === q.points
                              ? "You nailed it!"
                              : "Keep that spark going."}
                          </span>
                          <b>
                            {result.earned}/{q.points} XP
                          </b>
                        </div>
                        {result.checks.map((check, index) => (
                          <div
                            className={check.earned ? "pass" : "retry"}
                            key={index}
                          >
                            {check.earned ? (
                              <Check size={15} />
                            ) : (
                              <span className="retry-dot" />
                            )}
                            <span>{check.label}</span>
                            <small>
                              {check.earned}/{check.possible}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="quest-footer">
                  <button
                    className="text-button"
                    disabled={
                      questions.findIndex((item) => item.id === q.id) === 0
                    }
                    onClick={() =>
                      selectQuestion(
                        questions[
                          questions.findIndex((item) => item.id === q.id) - 1
                        ].id,
                      )
                    }
                  >
                    <ChevronLeft size={17} />
                    Previous
                  </button>
                  <span>
                    {result?.earned === q.points
                      ? "One small win. On to the next."
                      : "No timer. No pressure. Keep building."}
                  </span>
                  <button className="next-button" onClick={navigateNext}>
                    {q.id === "M10" ? "Finish line" : "Next mission"}
                    <ChevronRight size={17} />
                  </button>
                </div>
              </section>
            ) : (
              <section className="results-surface">
                <BadgeCollection score={score} chapter={chapter} expanded />
                <div className="results-title">
                  <div>
                    <div className="eyebrow">CHAPTER {chapter.number} · YOUR {chapter.title.toUpperCase()} QUEST</div>
                    <h2>
                      {allDone
                        ? "Quest complete. Well done."
                        : "Every point is progress."}
                    </h2>
                    <p>
                      {complete}/18 answers checked · {mastered}/18 mastered
                    </p>
                  </div>
                  <span className="grade-token">
                    <small>PRACTICE GRADE</small>
                    {gradeFor(score)}
                    <em>{score}/100</em>
                  </span>
                </div>
                <div className="results-layout">
                  <div>
                    <h3>Your scorecard</h3>
                    <div className="score-table">
                      {questions.map((item) => {
                        const r = currentResult(state, item);
                        return (
                          <button
                            onClick={() => selectQuestion(item.id)}
                            key={item.id}
                          >
                            <span
                              className={`score-dot ${r?.earned === item.points ? "done" : ""}`}
                            >
                              {r?.earned === item.points ? (
                                <Check size={13} />
                              ) : item.kind === "code" ? (
                                <Code2 size={13} />
                              ) : (
                                <BookOpen size={13} />
                              )}
                            </span>
                            <span>
                              {item.title}
                              <small>
                                {item.id} ·{" "}
                                {r
                                  ? "Checked"
                                  : state.results[item.id]
                                    ? "Edited, check again"
                                    : "Not checked"}
                              </small>
                            </span>
                            <b>
                              {r?.earned || 0}
                              <em>/{item.points}</em>
                            </b>
                            <ChevronRight size={15} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="finish-panel">
                    <div className="certificate-preview">
                      <Art
                        name={allDone ? "lesson-success" : "badge-python"}
                        mode={allDone ? "event" : "still"}
                        className="certificate-art"
                      />
                      <span className="eyebrow">ZHUDDLE</span>
                      <h3>
                        Small steps.
                        <br />
                        Big achievement.
                      </h3>
                      <p>
                        {allDone
                          ? `Your certificate is ready, ${state.student.name.split(" ")[0]}.`
                          : "Check all 18 answers to unlock your completion certificate."}
                      </p>
                      <span className="completion-count">
                        {complete}/18 COMPLETE
                      </span>
                    </div>
                    <button
                      className="primary-button full"
                      onClick={() => downloadPdf(true)}
                      disabled={!allDone || exporting}
                    >
                      {exporting ? (
                        <LoaderCircle className="spin" size={17} />
                      ) : allDone ? (
                        <Award size={17} />
                      ) : (
                        <LockKeyhole size={17} />
                      )}
                      Download certificate
                    </button>
                    <button
                      className="secondary-button full"
                      onClick={() => downloadPdf(false)}
                      disabled={exporting}
                    >
                      <Download size={17} />
                      Download grade report
                    </button>
                    <button
                      className="secondary-button full"
                      onClick={downloadNotebook}
                    >
                      <FileCode2 size={17} />
                      Download my notebook
                    </button>
                    <p className="fine-print">
                      Certificates record completion and your practice score.
                      Local results are subject to instructor review.
                    </p>
                    <label className="reflection-label" htmlFor="reflection">
                      A moment to reflect <span>Optional</span>
                    </label>
                    <textarea
                      id="reflection"
                      rows={4}
                      placeholder={`What did you learn about ${chapter.title.toLowerCase()}? Which answer would you approach differently now?`}
                      value={state.reflection}
                      onChange={(e) => update({ reflection: e.target.value })}
                    />
                    {error && (
                      <div className="notice error" role="alert">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
            {view === "quest" && (
              <KnowledgeCard selectQuestion={selectQuestion} />
            )}
            <footer className="page-footer">
              <span>
                <span className="status-dot" />
                {storageError
                  ? "Download to preserve your work"
                  : "Progress saved on this device"}
              </span>
              <button
                onClick={toggleMotion}
                disabled={systemReduced}
                title={
                  systemReduced
                    ? "Reduced motion is enabled in your system settings"
                    : undefined
                }
                aria-pressed={!reducedMotion}
              >
                {reducedMotion ? "Animations off" : "Animations on"}
              </button>
              <button onClick={() => setNewStudent(true)}>New student</button>
              <a href={SOURCE} target="_blank" rel="noreferrer">
                PY4E · CC BY 4.0
              </a>
            </footer>
            <p className="attribution">
              Based on Charles R. Severance’s Python for Everybody, {chapter.fullTitle}.
              ZHUDDLE is an independent practice project.
            </p>
          </main>
          <ProgressRail
            {...{
              chapter,
              state,
              questions,
              score,
              mastered,
              complete,
              selectQuestion,
              setView,
            }}
          />
        </div>
        {celebrate && (
          <div className="celebration" aria-hidden="true">
            <Art name="lesson-success" mode="event" />
            <span>
              Look at you, making progress!
              <small>Your hard work is adding up.</small>
            </span>
            <Art name="xp-star" mode="event" />
          </div>
        )}
        <dialog ref={dialog} onCancel={closeDialog} className="dialog">
          <button
            className="dialog-close icon-button"
            aria-label="Close dialog"
            onClick={closeDialog}
          >
            <X size={20} />
          </button>
          {profile ? (
            <form onSubmit={saveIdentity}>
              <Art name="helper-robot" mode="event" className="profile-art" />
              <div className="eyebrow">YOUR NEXT CHAPTER</div>
              <h2>Make it your quest.</h2>
              <p>Your name and UNT ID will appear on your downloads.</p>
              <label htmlFor="student-name">Full name</label>
              <input
                id="student-name"
                required
                maxLength={100}
                pattern=".*\S.*"
                autoComplete="name"
                value={identity.name}
                onChange={(e) =>
                  setIdentity({ ...identity, name: e.target.value })
                }
              />
              <label htmlFor="unt-id">UNT ID</label>
              <input
                id="unt-id"
                required
                maxLength={64}
                pattern=".*\S.*"
                autoComplete="off"
                value={identity.untId}
                onChange={(e) =>
                  setIdentity({ ...identity, untId: e.target.value })
                }
              />
              <p className="fine-print">
                Stored only in this browser. Download your work before using a
                different device or clearing browser data.
              </p>
              <button className="primary-button full" type="submit">
                {state.student.name ? "Save profile" : "Let’s build something"}
                <ChevronRight size={17} />
              </button>
            </form>
          ) : resetQuestion ? (
            <>
              <h2>Try a fresh start?</h2>
              <p>
                This restores the starter code for {q.title}. Download your
                notebook first to keep your current answer.
              </p>
              <button
                className="secondary-button full"
                onClick={downloadNotebook}
              >
                <Download size={17} />
                Download my work
              </button>
              <button
                className="primary-button full"
                onClick={() => {
                  setState((s) => ({
                    ...s,
                    code: { ...s.code, [q.id]: q.starter },
                    results: { ...s.results, [q.id]: undefined },
                  }));
                  closeDialog();
                }}
              >
                Reset this mission
              </button>
            </>
          ) : (
            <>
              <h2>A new student's turn?</h2>
              <p>
                Download the current student's work first. Starting again clears
                this browser's saved name, ID, code, and scores across all seven chapters. Download each chapter's work before continuing.
              </p>
              <button
                className="secondary-button full"
                onClick={downloadNotebook}
              >
                <Download size={17} />
                Download current work
              </button>
              <button
                className="primary-button full"
                onClick={() => {
                  stopRun();
                  try { resetStudent(); } catch (e) { setStorageError(e.message); closeDialog(); }
                }}
              >
                Start fresh
              </button>
            </>
          )}
        </dialog>
      </div>
    </MotionContext.Provider>
  );
}
