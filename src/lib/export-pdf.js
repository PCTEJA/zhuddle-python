import {jsPDF} from 'jspdf';
import {scoreState,currentResult,badgeFor,gradeFor} from './progress';

const defaultChapter = { id:'functions', number:'04', title:'Functions', source:'https://www.py4e.com/html3/04-functions' };

export function buildPdf(state,questions,certificate=false,chapter=defaultChapter) {
  const {score,complete} = scoreState(state,questions);
  if(!state.student.name.trim()||!state.student.untId.trim()) throw new Error('Enter your name and UNT ID first.');
  if(certificate&&complete!==questions.length) throw new Error('Check all 18 answers to unlock your certificate.');
  const doc = new jsPDF({orientation:certificate?'landscape':'portrait',unit:'mm',format:'a4'});
  doc.setProperties({title:`Chapter ${chapter.number}: ${chapter.title} | ${certificate?'Certificate':'Grade report'}`,subject:chapter.source,author:'ZHUDDLE'});
  const width=doc.internal.pageSize.getWidth(), height=doc.internal.pageSize.getHeight();
  const date = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  let y=24;
  const text=(value,size=11,color=[44,60,53],center=false)=>{
    doc.setTextColor(...color); doc.setFontSize(size);
    const lines=doc.splitTextToSize(String(value),width-48);
    for (const line of lines) {
      if (!certificate && y + size * .42 > height - 22) { doc.addPage(); y=24; }
      doc.text(line,center?width/2:24,y,center?{align:'center'}:{}); y+=size*.42;
    }
    y+=5;
  };
  if(certificate) {
    doc.setFillColor(249,251,248);doc.rect(0,0,width,height,'F');
    doc.setDrawColor(25,103,77);doc.setLineWidth(.8);doc.rect(10,10,width-20,height-20);
    doc.setFillColor(25,103,77);doc.rect(10,10,5,height-20,'F');
    y=33;text('ZHUDDLE',25,[25,103,77],true);
    y=51;text('CERTIFICATE OF COMPLETION',13,[68,79,72],true);
    y=70;text('This recognizes',11,[83,94,85],true);
    doc.setFont('helvetica','bold');
    let nameSize = 28;
    doc.setFontSize(nameSize);
    while (doc.getTextWidth(state.student.name) > width-60 && nameSize > 12) doc.setFontSize(--nameSize);
    text(state.student.name,nameSize,[31,45,38],true);
    doc.setFont('helvetica','normal');
    text(`for completing Chapter ${chapter.number}: ${chapter.title}`,15,[44,60,53],true);
    text('10 knowledge checks. 8 coding missions. One step forward.',11,[83,94,85],true);
    y=127;text(`${score} / 100 XP     |     Practice grade ${gradeFor(score)}`,21,[25,103,77],true);
    text(badgeFor(score,chapter.id==='functions'?'Function':chapter.title),13,[200,87,60],true);
    y=164;text(`UNT ID: ${state.student.untId}   |   ${date}`,10,[68,79,72],true);
    text('ZHUDDLE.COM  |  Local practice completion; not an official UNT credential.',9,[83,94,85],true);
    text(`Based on Python for Everybody: ${chapter.title}, Charles R. Severance (CC BY 4.0).`,8,[83,94,85],true);
  } else {
    text('ZHUDDLE',24,[25,103,77]);text(`Chapter ${chapter.number}: ${chapter.title} | Grade report`,17);
    text('Student: '+state.student.name);text('UNT ID: '+state.student.untId);
    text(`${score}/100 XP | Practice grade ${gradeFor(score)} | ${badgeFor(score,chapter.id==='functions'?'Function':chapter.title)}`,14,[25,103,77]);
    text(`Checked: ${complete}/18 | ${date}`,10);
    text('Local self-check results pending instructor review. Unchecked or edited answers earn zero.',9);
    for(const q of questions) {
      const r=currentResult(state,q);
      const feedback=r?[r.error,...r.checks.map(c=>`${c.earned?'PASS':'RETRY'}: ${c.label}`)].filter(Boolean).join('  '):'Not checked, or edited since the last check.';
      const lines=doc.splitTextToSize(feedback,width-48);
      if(y+lines.length*3.8+19>height-22){doc.addPage();y=23;}
      doc.setFont('helvetica','bold');text(`${q.id} | ${q.title} | ${r?.earned||0}/${q.points}`,11);
      doc.setFont('helvetica','normal');text(feedback,9);
    }
    if(y>height-47){doc.addPage();y=23;}
    text('Source: '+chapter.source,9);
    text('Charles R. Severance. Python for Everybody. CC BY 4.0. Adapted questions and scaffolding.',8);
    for(let page=1;page<=doc.getNumberOfPages();page++){
      doc.setPage(page);doc.setFontSize(8);doc.setTextColor(90);doc.text(`ZHUDDLE.COM | Chapter ${chapter.number}: ${chapter.title} | ${page} / ${doc.getNumberOfPages()}`,24,height-12);
    }
  }
  return doc;
}

export function exportPdf(state,questions,certificate=false,chapter=defaultChapter) {
  const doc = buildPdf(state, questions, certificate, chapter);
  const safeId=state.student.untId.replace(/[^a-zA-Z0-9_-]/g,'_');
  doc.save(`ZHUDDLE_Chapter_${chapter.number}_${chapter.title}_${certificate?'Certificate':'Grade_Report'}_${safeId}.pdf`);
}
