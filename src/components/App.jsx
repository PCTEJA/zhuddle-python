import React, {useEffect,useRef,useState,lazy,Suspense} from 'react';
import {Flame,Code2,BookOpen,Check,ChevronRight,ChevronLeft,Play,RotateCcw,Download,Award,ArrowUpRight,Lightbulb,Terminal,CheckCircle2,UserRound,Menu,X,LoaderCircle,Square,LockKeyhole,FileCode2,Flag,Sparkles} from 'lucide-react';
import Markdown from 'react-markdown';
import questions from '../data/questions.json';
import {STORAGE_KEY,freshState,scoreState,currentResult,badgeFor,gradeFor,downloadBlob,submissionNotebook} from '../lib/progress';

const Editor=lazy(()=>import('./Editor'));
const codeQuestions=questions.filter(q=>q.kind==='code'), mcQuestions=questions.filter(q=>q.kind==='mcq');
const SOURCE='https://www.py4e.com/html3/04-functions';

export default function App(){
  const [state,setState]=useState(()=>freshState(questions));
  const [loaded,setLoaded]=useState(false), [storageError,setStorageError]=useState('');
  const [view,setView]=useState('quest'),[menu,setMenu]=useState(false),[hint,setHint]=useState(false);
  const [profile,setProfile]=useState(false),[identity,setIdentity]=useState({name:'',untId:''});
  const [busy,setBusy]=useState(false),[pythonStatus,setPythonStatus]=useState('idle'),[error,setError]=useState('');
  const [celebrate,setCelebrate]=useState(false),[resetQuestion,setResetQuestion]=useState(false),[newStudent,setNewStudent]=useState(false);
  const [exporting,setExporting]=useState(false),[reducedMotion,setReducedMotion]=useState(false);
  const worker=useRef(null), timer=useRef(null), pending=useRef(null), request=useRef(0), dialog=useRef(null), returnFocus=useRef(null);
  const q=questions.find(q=>q.id===state.active)||questions[0];
  const result=currentResult(state,q),{score,complete,mastered}=scoreState(state,questions);
  const codeScore=codeQuestions.reduce((s,q)=>s+(currentResult(state,q)?.earned||0),0);
  const needsIdentity=!state.student.name||!state.student.untId;
  const allDone=complete===questions.length;

  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(saved?.version===1 && typeof saved.code==='object' && saved.student){
        const base=freshState(questions);
        setState({...base,...saved,code:{...base.code,...saved.code}});
      }
    }catch{setStorageError('Saved progress could not be opened. Download your work before leaving.');}
    setReducedMotion(matchMedia('(prefers-reduced-motion: reduce)').matches);
    setLoaded(true);
    return ()=>{worker.current?.terminate();clearTimeout(timer.current);};
  },[]);
  useEffect(()=>{if(loaded){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{setStorageError('This browser cannot save progress. Download your notebook before leaving.');}}},[state,loaded]);
  useEffect(()=>{
    if(profile||resetQuestion||newStudent){
      returnFocus.current=document.activeElement;dialog.current?.showModal();
    }else if(dialog.current?.open){dialog.current.close();returnFocus.current?.focus?.();}
  },[profile,resetQuestion,newStudent]);

  function update(patch){setState(s=>({...s,...patch}));}
  function selectQuestion(id){update({active:id});setView('quest');setMenu(false);setHint(false);setError('');}
  function openProfile(){setIdentity(state.student);setProfile(true);}
  function closeDialog(){setProfile(false);setResetQuestion(false);setNewStudent(false);}
  function saveIdentity(e){e.preventDefault();update({student:{name:identity.name.trim(),untId:identity.untId.trim()}});setProfile(false);}
  function storeResult(qid,value){
    setState(s=>({...s,results:{...s.results,[qid]:{...value,attempts:(s.results[qid]?.attempts||0)+1}}}));
    if(value.earned>0){setCelebrate(true);setTimeout(()=>setCelebrate(false),1600);}
  }
  function bootWorker(){
    if(worker.current)return;
    setPythonStatus('loading');
    worker.current=new Worker('/python-worker.js');
    worker.current.onmessage=({data})=>{
      if(data.type==='ready'){
        setPythonStatus('ready');
        if(pending.current){const task=pending.current;pending.current=null;sendCode(task);}
        else clearTimeout(timer.current);
      }else if(data.type==='result'&&data.id===request.current){
        clearTimeout(timer.current);setBusy(false);setPythonStatus('ready');
        storeResult(data.result.sourceId||pending.current?.qid||worker.current.taskQid,data.result);
      }else if(data.type==='error'){
        clearTimeout(timer.current);setBusy(false);setPythonStatus('error');setError(data.message);
        worker.current?.terminate();worker.current=null;pending.current=null;
      }
    };
    worker.current.onerror=()=>{setError('Python could not start. Check your internet connection, then run again.');stopRun();};
    worker.current.postMessage({type:'init'});
  }
  function sendCode(task){
    worker.current.taskQid=task.qid;
    worker.current.postMessage({...task,type:'run',id:++request.current});
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>{setError('This run took too long. Check your loop and try again.');stopRun();},10000);
  }
  function stopRun(){worker.current?.terminate();worker.current=null;pending.current=null;clearTimeout(timer.current);setBusy(false);setPythonStatus('idle');}
  function runCode(){
    if(needsIdentity){openProfile();return;}
    const source=state.code[q.id];
    if(source.length>20000){setError('Keep this answer under 20,000 characters.');return;}
    setError('');setBusy(true);
    const task={qid:q.id,source};
    if(pythonStatus==='ready'&&worker.current){sendCode(task);}
    else{
      pending.current=task;bootWorker();
      clearTimeout(timer.current);
      timer.current=setTimeout(()=>{setError('Python is taking too long to load. Check your connection and retry.');stopRun();},90000);
    }
  }
  function checkChoice(){
    if(needsIdentity){openProfile();return;}
    const choice=state.choices[q.id];if(!choice)return;
    const earned=choice===q.answer?2:0;
    storeResult(q.id,{source:choice,earned,possible:2,checks:[{earned,possible:2,label:earned?'Correct. Knowledge key earned.':'Review the chapter and try another answer.'}],stdout:'',error:null});
  }
  async function downloadPdf(certificate){
    if(needsIdentity){openProfile();return;}
    setExporting(true);setError('');
    try{const {exportPdf}=await import('../lib/export-pdf');exportPdf(state,questions,certificate);}
    catch(e){setError(e.message||'The PDF could not be created. Please retry.');}
    finally{setExporting(false);}
  }
  function downloadNotebook(){
    if(needsIdentity){openProfile();return;}
    downloadBlob(submissionNotebook(state,questions),'application/x-ipynb+json','ZHUDDLE_Student_Submission.ipynb');
  }
  const navigateNext=()=>{const i=questions.findIndex(item=>item.id===q.id);if(i===questions.length-1)setView('results');else selectQuestion(questions[i+1].id);};

  return <div className={`app ${reducedMotion?'reduce-motion':''}`}>
    <a className="skip-link" href="#workspace">Skip to exercise</a>
    <header className="topbar">
      <div className="brand"><img src="/favicon.svg" width="35" height="35" alt=""/><span>ZHUDDLE<span className="brand-dot">.</span></span></div>
      <nav className="topnav" aria-label="Main navigation">
        <button className={view==='quest'?'selected':''} onClick={()=>setView('quest')}><Code2 size={17}/>My learning</button>
        <button className={view==='results'?'selected':''} onClick={()=>setView('results')}><Award size={17}/>My achievements</button>
      </nav>
      <div className="top-actions"><span className="xp-pill"><Flame size={18} className="little-flame"/>{score} XP</span>
        <button className="profile-button" onClick={openProfile} aria-label="Student profile" title="Student profile"><UserRound size={18}/><span>{state.student.name?state.student.name.split(' ')[0]:'Join the quest'}</span></button>
        <button className="icon-button mobile-menu" title="Course menu" aria-label="Course menu" onClick={()=>setMenu(!menu)}><Menu/></button>
      </div>
    </header>
    {menu&&<button className="scrim" aria-label="Close course menu" onClick={()=>setMenu(false)}/>}
    <aside className={`sidebar ${menu?'open':''}`}>
      <div className="course-label">YOUR LEARNING PATH</div>
      <h2>Python foundations</h2><p className="sidebar-sub">Chapter 04 · Functions</p>
      <div className="sidebar-progress"><span>{complete} of 18 checked</span><b>{Math.round(complete/18*100)}%</b></div>
      <div className="progress-track"><span style={{width:`${complete/18*100}%`}}/></div>
      <div className="path-group"><span><Code2 size={16}/>Coding missions</span><b>{codeScore}/80</b></div>
      <nav aria-label="Coding missions" className="mission-list">{codeQuestions.map((item,index)=>{
        const r=currentResult(state,item);return <button key={item.id} className={`${state.active===item.id&&view==='quest'?'active':''} ${r?.earned===10?'mastered':''}`} onClick={()=>selectQuestion(item.id)}>
          <span className="mission-number">{r?.earned===10?<Check size={14}/>:String(index+1).padStart(2,'0')}</span><span>{item.title}<small>{item.level} · 10 XP</small></span>{state.active===item.id&&view==='quest'&&<ChevronRight size={15}/>}</button>;
      })}</nav>
      <div className="path-group"><span><BookOpen size={16}/>Knowledge keys</span><b>{score-codeScore}/20</b></div>
      <nav className="mcq-grid" aria-label="Knowledge keys">{mcQuestions.map((item,index)=><button key={item.id} title={item.title} aria-label={`Question ${index+1}: ${item.title}`} className={`${state.active===item.id&&view==='quest'?'active':''} ${currentResult(state,item)?.earned===2?'mastered':''}`} onClick={()=>selectQuestion(item.id)}>{currentResult(state,item)?.earned===2?<Check size={16}/>:index+1}</button>)}</nav>
      <button className="finish-link" onClick={()=>{setView('results');setMenu(false);}}><Flag size={17}/>Finish line<ChevronRight size={16}/></button>
      <div className="sidebar-bottom"><a href={SOURCE} target="_blank" rel="noreferrer"><BookOpen size={16}/>Read the chapter<ArrowUpRight size={14}/></a><a href="/ZHUDDLE_Functions_Quest.ipynb" download><FileCode2 size={16}/>Offline notebook<Download size={14}/></a></div>
    </aside>
    <main id="workspace" className="main">
      {storageError&&<div className="notice error" role="alert">{storageError}</div>}
      <section className="welcome-band">
        <div><div className="eyebrow"><span className="status-dot"/>LEARN. TRY. LEVEL UP.</div><h1>{view==='results'?'Look how far you\'ve come.':'A little practice. A new superpower.'}</h1><p>{view==='results'?'Your effort, your progress, your next step.':'Your Python journey starts with one good function.'}</p></div>
        <div className="spark-scene" aria-hidden="true"><span className="spark-plus plus-one">+</span><img src="/spark.svg" className="spark-character" alt="" width="80" height="89"/><span className="spark-plus plus-two">+</span><span className="spark-shadow"/></div>
      </section>
      <section className="stats-bar" aria-label="Your progress">
        <div><span className="stat-icon green"><Sparkles size={21}/></span><span><small>TOTAL XP</small><b>{score}<em> / 100</em></b></span></div>
        <div><span className="stat-icon coral"><Flame size={22} className="little-flame"/></span><span><small>MASTERED</small><b>{mastered}<em> / 18</em></b></span></div>
        <div><span className="stat-icon gold"><Award size={22}/></span><span><small>CURRENT BADGE</small><strong>{badgeFor(score)}</strong></span></div>
        <div className="certificate-shortcut"><button onClick={()=>setView('results')}><Award size={17}/>{allDone?'Certificate unlocked':'Your certificate'}<ChevronRight size={17}/></button></div>
      </section>
      {needsIdentity&&<div className="identity-banner"><UserRound size={18}/><span>Add your name and UNT ID to begin earning XP.</span><button onClick={openProfile}>Join the quest<ChevronRight size={16}/></button></div>}
      {view==='quest'?<section className="quest-surface" key={q.id}>
        <div className="quest-heading"><div><div className="eyebrow">{q.kind==='code'?'CODING MISSION':'KNOWLEDGE KEY'} {q.id.slice(1)} / {q.kind==='code'?'08':'10'}</div><h2>{q.title}</h2></div><div className="mission-tags"><span className={q.level==='Easy'?'tag easy':'tag medium'}>{q.level}</span><span className="tag points"><Flame size={14}/>{q.points} XP</span></div></div>
        <div className={q.kind==='code'?'coding-layout':'quiz-layout'}>
          <div className="instructions"><div className="section-heading"><BookOpen size={17}/>Your mission</div><Markdown>{q.task}</Markdown>
            {q.hint&&<div className="hint"><button aria-expanded={hint} onClick={()=>setHint(!hint)}><Lightbulb size={17}/>A little nudge<ChevronRight className={hint?'rotated':''} size={16}/></button>{hint&&<p>{q.hint}</p>}</div>}
            <div className="source-note"><BookOpen size={14}/><span>From PY4E: {q.source}<a href={SOURCE} target="_blank" rel="noreferrer">Open chapter<ArrowUpRight size={12}/></a></span></div>
            {q.kind==='code'&&<div className="small-encouragement"><Flame size={16}/>Every retry is part of learning.</div>}
          </div>
          <div className="answer-area">{q.kind==='code'?<>
            <div className="editor-frame"><div className="editor-topline"><span><FileCode2 size={15}/>{q.id.toLowerCase()}.py</span><span>Python 3</span><button className="icon-button" title="Reset starter code" aria-label="Reset starter code" disabled={busy} onClick={()=>setResetQuestion(true)}><RotateCcw size={15}/></button></div>
              <Suspense fallback={<div className="editor-loading">Opening your workspace...</div>}><Editor value={state.code[q.id]||''} disabled={busy} onChange={value=>setState(s=>({...s,code:{...s.code,[q.id]:value}}))}/></Suspense>
              <div className="editor-actions"><span><span className={`status-dot ${pythonStatus==='ready'?'':'muted'}`}/>{busy?(pythonStatus==='loading'?'Warming up Python...':'Running your code...'):result?'Checked · '+result.earned+'/10 XP':state.results[q.id]?'Edited · run to update':'Ready when you are'}</span>{busy?<button className="stop-button" onClick={stopRun}><Square size={14}/>Stop</button>:<button className="run-button" onClick={runCode} disabled={!loaded}><Play size={16} fill="currentColor"/>Run & check</button>}</div>
            </div>
            <div className="console"><div className="console-header"><Terminal size={15}/>Output<span>{result?`Attempt ${result.attempts}`:'Awaiting your first run'}</span></div><pre>{result?.error||result?.stdout||(result?'Your code ran without printed output.':'Your output will appear here.')}</pre></div>
          </>:<div className="choice-list" role="radiogroup" aria-label="Choose an answer">{q.options.map(option=><label key={option.letter} className={`choice ${state.choices[q.id]===option.letter?'chosen':''}`}><input type="radio" name={q.id} checked={state.choices[q.id]===option.letter} onChange={()=>setState(s=>({...s,choices:{...s.choices,[q.id]:option.letter}}))}/><span className="choice-letter">{option.letter}</span><span>{option.text}</span></label>)}<button className="primary-button" disabled={!state.choices[q.id]} onClick={checkChoice}><CheckCircle2 size={17}/>Check answer</button></div>}
          {error&&<div className="notice error" role="alert">{error}</div>}
          {result&&<div className="check-results" aria-live="polite"><div className="result-heading"><span>{result.earned===q.points?<CheckCircle2 size={19}/>:<Lightbulb size={19}/>} {result.earned===q.points?'You nailed it!':'Keep that spark going.'}</span><b>{result.earned}/{q.points} XP</b></div>{result.checks.map((check,index)=><div className={check.earned?'pass':'retry'} key={index}>{check.earned?<Check size={15}/>:<span className="retry-dot"/>}<span>{check.label}</span><small>{check.earned}/{check.possible}</small></div>)}</div>}
          </div>
        </div>
        <div className="quest-footer"><button className="text-button" disabled={questions.findIndex(item=>item.id===q.id)===0} onClick={()=>selectQuestion(questions[questions.findIndex(item=>item.id===q.id)-1].id)}><ChevronLeft size={17}/>Previous</button><span>{result?.earned===q.points?'One small win. On to the next.':'No timer. No pressure. Keep building.'}</span><button className="next-button" onClick={navigateNext}>{q.id==='M10'?'Finish line':'Next mission'}<ChevronRight size={17}/></button></div>
      </section>:<section className="results-surface">
        <div className="results-title"><div><div className="eyebrow">YOUR FUNCTIONS QUEST</div><h2>{allDone?'Quest complete. Well done.':'Every point is progress.'}</h2><p>{complete}/18 answers checked · {mastered}/18 mastered</p></div><span className="grade-token"><small>PRACTICE GRADE</small>{gradeFor(score)}<em>{score}/100</em></span></div>
        <div className="results-layout"><div><h3>Your scorecard</h3><div className="score-table">{questions.map(item=>{const r=currentResult(state,item);return <button onClick={()=>selectQuestion(item.id)} key={item.id}><span className={`score-dot ${r?.earned===item.points?'done':''}`}>{r?.earned===item.points?<Check size={13}/>:item.kind==='code'?<Code2 size={13}/>:<BookOpen size={13}/>}</span><span>{item.title}<small>{item.id} · {r?'Checked':state.results[item.id]?'Edited, check again':'Not checked'}</small></span><b>{r?.earned||0}<em>/{item.points}</em></b><ChevronRight size={15}/></button>;})}</div></div>
          <div className="finish-panel"><div className="certificate-preview"><img src="/spark.svg" alt="ZHUDDLE flame" width="55" height="61"/><span className="eyebrow">ZHUDDLE</span><h3>Small steps.<br/>Big achievement.</h3><p>{allDone?`Your certificate is ready, ${state.student.name.split(' ')[0]}.`:'Check all 18 answers to unlock your completion certificate.'}</p><span className="completion-count">{complete}/18 COMPLETE</span></div>
            <button className="primary-button full" onClick={()=>downloadPdf(true)} disabled={!allDone||exporting}>{exporting?<LoaderCircle className="spin" size={17}/>:allDone?<Award size={17}/>:<LockKeyhole size={17}/>}Download certificate</button>
            <button className="secondary-button full" onClick={()=>downloadPdf(false)} disabled={exporting}><Download size={17}/>Download grade report</button>
            <button className="secondary-button full" onClick={downloadNotebook}><FileCode2 size={17}/>Download my notebook</button>
            <p className="fine-print">Certificates record completion and your practice score. Local results are subject to instructor review.</p>
            <label className="reflection-label" htmlFor="reflection">A moment to reflect <span>Optional</span></label><textarea id="reflection" rows={4} placeholder="What changed when you ran the random-number mission twice? Why did moving the function call help?" value={state.reflection} onChange={e=>update({reflection:e.target.value})}/>
            {error&&<div className="notice error" role="alert">{error}</div>}
          </div>
        </div>
      </section>}
      <footer className="page-footer"><span><span className="status-dot"/>{storageError?'Download to preserve your work':'Progress saved on this device'}</span><button onClick={()=>setReducedMotion(!reducedMotion)} aria-pressed={reducedMotion}>{reducedMotion?'Animations off':'Animations on'}</button><button onClick={()=>setNewStudent(true)}>New student</button><a href={SOURCE} target="_blank" rel="noreferrer">PY4E · CC BY 4.0</a></footer>
      <p className="attribution">Based on Charles R. Severance’s Python for Everybody, Functions. ZHUDDLE is an independent practice project.</p>
    </main>
    {celebrate&&<div className="celebration" aria-hidden="true"><Flame/><span>Keep the spark alive!</span><Sparkles/></div>}
    <dialog ref={dialog} onCancel={closeDialog} className="dialog"><button className="dialog-close icon-button" aria-label="Close dialog" onClick={closeDialog}><X size={20}/></button>
      {profile?<form onSubmit={saveIdentity}><img src="/spark.svg" alt="" width="48" height="54"/><div className="eyebrow">YOUR NEXT CHAPTER</div><h2>Make it your quest.</h2><p>Your name and UNT ID will appear on your downloads.</p><label htmlFor="student-name">Full name</label><input id="student-name" required maxLength={100} pattern=".*\S.*" autoComplete="name" value={identity.name} onChange={e=>setIdentity({...identity,name:e.target.value})}/><label htmlFor="unt-id">UNT ID</label><input id="unt-id" required maxLength={64} pattern=".*\S.*" autoComplete="off" value={identity.untId} onChange={e=>setIdentity({...identity,untId:e.target.value})}/><p className="fine-print">Stored only in this browser. Download your work before using a different device or clearing browser data.</p><button className="primary-button full" type="submit">{state.student.name?'Save profile':'Let’s build something'}<ChevronRight size={17}/></button></form>:resetQuestion?<><h2>Try a fresh start?</h2><p>This restores the starter code for {q.title}. Download your notebook first to keep your current answer.</p><button className="secondary-button full" onClick={downloadNotebook}><Download size={17}/>Download my work</button><button className="primary-button full" onClick={()=>{setState(s=>({...s,code:{...s.code,[q.id]:q.starter},results:{...s.results,[q.id]:undefined}}));closeDialog();}}>Reset this mission</button></>:<><h2>A new student's turn?</h2><p>Download the current student's work first. Starting again clears this browser's saved name, ID, code, and scores.</p><button className="secondary-button full" onClick={downloadNotebook}><Download size={17}/>Download current work</button><button className="primary-button full" onClick={()=>{stopRun();setState(freshState(questions));setView('quest');closeDialog();}}>Start fresh</button></>}
    </dialog>
  </div>;
}
