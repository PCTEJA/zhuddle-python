export const STORAGE_KEY = 'zhuddle-functions-v1';
export const badgeFor = (score, title = 'Function') => `${title} ${score === 100 ? 'Champion' : score >= 75 ? 'Builder' : score >= 50 ? 'Explorer' : 'Starter'}`;
export const gradeFor = score => score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
export function freshState(questions) {
  return {version:1, student:{name:'',untId:''}, code:Object.fromEntries(questions.filter(q=>q.kind==='code').map(q=>[q.id,q.starter])), choices:{}, results:{}, reflection:'', active:'C01'};
}
export function currentResult(state,q) {
  const r = state.results[q.id];
  return r && r.source === (q.kind === 'code' ? state.code[q.id] : state.choices[q.id]) ? r : null;
}
export function scoreState(state,questions) {
  const results = questions.map(q=>currentResult(state,q));
  return {score:results.reduce((sum,r)=>sum+(r?.earned||0),0), complete:results.filter(Boolean).length,
    mastered:results.filter((r,i)=>r?.earned===questions[i].points).length};
}
export function downloadBlob(data,type,name) {
  const url = URL.createObjectURL(new Blob([data],{type}));
  const a = document.createElement('a'); a.href=url; a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),20000);
}
export function submissionNotebook(state,questions,chapter={id:'functions',number:'04',title:'Functions',source:'https://www.py4e.com/html3/04-functions'}) {
  const {score,complete} = scoreState(state,questions);
  const md = source=>({cell_type:'markdown',id:crypto.randomUUID().slice(0,8),metadata:{},source});
  const code = (source,stdout)=>({cell_type:'code',id:crypto.randomUUID().slice(0,8),metadata:{},source,execution_count:null,
    outputs:stdout?[{output_type:'stream',name:'stdout',text:stdout}]:[]});
  const cells = [md(`# ZHUDDLE | Chapter ${chapter.number}: ${chapter.title} Quest\n\nName: ${state.student.name}\n\nUNT ID: ${state.student.untId}\n\nScore: ${score}/100\n\nChecked: ${complete}/18\n\nExported: ${new Date().toISOString()}\n\nLocal practice results, pending instructor review.\n\nSource: ${chapter.source}`)];
  for(const q of questions) {
    const r = currentResult(state,q);
    cells.push(md(q.prompt));
    if (q.kind === 'code') {
      let setup = q.setup || '';
      for (const [name, contents] of Object.entries(q.sampleFiles || {})) {
        setup += `\n# Practice file supplied by ZHUDDLE\nwith open(${JSON.stringify(name)}, "w") as fixture:\n    fixture.write(${JSON.stringify(contents)})\n`;
      }
      if (setup) cells.push(code(setup));
    }
    cells.push(code(q.kind==='code'?state.code[q.id]:`${q.id.toLowerCase()} = ${JSON.stringify(state.choices[q.id]||'')}`,r?.stdout));
    cells.push(md(`Score: ${r?.earned||0}/${q.points}\n\n${r?[r.error,...r.checks.map(c=>`${c.earned?'PASS':'RETRY'}: ${c.label}`)].filter(Boolean).join('\n\n'):'Not checked, or edited since the last check.'}`));
  }
  cells.push(md('## Reflection\n\n'+(state.reflection||'(Not entered)')));
  cells.push(md(`Adapted from Charles R. Severance, Python for Everybody: ${chapter.title}. CC BY 4.0. https://www.py4e.com/book`));
  return JSON.stringify({nbformat:4,nbformat_minor:5,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python'},zhuddle:{chapterId:chapter.id,chapterNumber:chapter.number,score,complete,student:state.student}},cells},null,2);
}
