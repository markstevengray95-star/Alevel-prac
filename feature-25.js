(()=>{
'use strict';const T=window.PracticalTools;if(!T)return;
const labels=['Set-up','Measurements','Variables & method','Data sufficiency','Graph processing','Uncertainty','Conclusion','Evaluation','Practical record','Confidence'];
function entry(id){return state.labBook?.[String(id)]||state.labBook?.[id]||{};}
function dataCount(id){return Object.entries(state.data||{}).filter(([k])=>k.startsWith(id+'_')).reduce((n,[,v])=>n+(Array.isArray(v)?v.length:0),0);}
function calc(id){const e=entry(id),cp=state.cpac?.[id]||[],item=state.items?.[id]||{},d=dataCount(id),setupChecks=e.setupChecks?Object.values(e.setupChecks).filter(Boolean).length:0,unc=(e.uncRows||[]).filter(r=>Object.values(r||{}).some(Boolean)).length,evals=(e.evalRows||[]).filter(r=>r?.limitation&&r?.improvement).length;
 const scores=[
  Math.min(100,(setupChecks?70:0)+(e.setup?30:0)),
  Math.min(100,(d?55:0)+(cp.includes(1)?25:0)+((e.rawRows||[]).length>=4?20:0)),
  Math.min(100,(e.independent?25:0)+(e.dependent?25:0)+(e.controls?25:0)+(e.method?25:0)),
  d>=6?100:d>=4?75:d>=2?45:d?25:0,
  Math.min(100,(e.graph?65:0)+(e.graphResult?35:0)),
  Math.min(100,(unc?65:0)+(e.calculations?35:0)),
  e.conclusion?(e.conclusion.length>120?100:70):0,
  evals>=3?100:evals===2?75:evals===1?45:0,
  Math.round(((e.completed?Object.values(e.completed).filter(Boolean).length:0)/9)*100),
  item.status==='confident'?100:item.status==='started'?55:15
 ];return scores;}
function colour(v){return v>=80?'mastery-high':v>=50?'mastery-mid':'mastery-low';}
function render(root,opts={}){let id=+(opts.practicalId||state.last||1);
 function draw(){const p=T.practical(id),s=calc(id),avg=Math.round(s.reduce((a,b)=>a+b,0)/s.length),weak=s.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v).slice(0,3);root.innerHTML=`<div class="tool-panel"><div class="tool-row"><label><b>Practical</b> <select id="pmP">${practicals.map(x=>`<option value="${x.id}" ${x.id===id?'selected':''}>${x.id}. ${T.esc(x.title)}</option>`).join('')}</select></label><span class="tool-pill">Activity-based mastery</span></div></div><div class="mastery-hero tool-panel"><div class="mastery-ring" style="--p:${avg}"><span><b>${avg}%</b><small>overall</small></span></div><div><span class="eyebrow">PRACTICAL ${id} MASTERY</span><h2>${T.esc(p.title)}</h2><p>This score summarises activity already stored in the app. It is a learning-progress indicator, <b>not</b> an AQA Practical Endorsement decision.</p><div class="tool-row"><span class="tool-pill">${dataCount(id)} recorded simulation readings</span><span class="tool-pill">${p.at.join(' · ')}</span></div></div></div><div class="mastery-grid">${labels.map((x,i)=>`<div class="mastery-card ${colour(s[i])}"><div class="mastery-card-head"><b>${T.esc(x)}</b><span>${s[i]}%</span></div><div class="mastery-bar"><i style="width:${s[i]}%"></i></div><small>${hint(i,s[i])}</small></div>`).join('')}</div><div class="tool-two"><div class="tool-panel"><h3>Next best actions</h3><ol>${weak.map(x=>`<li><b>${T.esc(labels[x.i])}</b> — ${T.esc(nextAction(x.i,id))}</li>`).join('')}</ol><div class="tool-actions"><button class="primary-btn" id="pmOpen">Open practical</button><button class="secondary-btn" id="pmLab">Open Lab Book</button></div></div><div class="tool-panel"><h3>What this page uses</h3><ul><li>Recorded simulator readings and range of evidence.</li><li>Structured Lab Book fields, uncertainty/evaluation rows and completed sections.</li><li>Practical-skills checklist activity and confidence status.</li></ul><div class="tool-callout">Teacher observation and real practical performance remain essential for the Practical Endorsement; this dashboard only tracks learning evidence inside this app.</div></div></div>`;root.querySelector('#pmP').onchange=e=>{id=+e.target.value;draw();};root.querySelector('#pmOpen').onclick=()=>navigate('practical',id);root.querySelector('#pmLab').onclick=()=>navigate('labbook',id);T.mark(25,true);}
 draw();}
function hint(i,v){if(v>=80)return 'Strong evidence recorded in the app.';if(v>=50)return 'Developing — add another piece of evidence.';return 'Priority area — complete the linked practical task.';}
function nextAction(i,id){return [
 'Open Setup Challenge and complete the AQA-style arrangement, then record the setup in the Lab Book.',
 'Use Live Measurement mode and record a fuller set of readings with units.',
 'Complete Planning Challenge and fill in independent, dependent and control variables in the Lab Book.',
 'Collect at least 6 well-spaced readings and include repeats where appropriate.',
 'Complete Graph Choice and Graph & Uncertainty Workshop, then record the gradient/intercept meaning.',
 'Use the practical-specific Uncertainty Calculator and add instrument/resolution evidence to the Lab Book.',
 'Write a conclusion that answers the aim using a measured relationship/result and units.',
 'Add at least three limitation → effect → specific improvement links.',
 'Work through the nine Lab Book sections and mark each complete only when evidence is present.',
 'Revisit the practical, exam questions and variation challenge before marking it confident.'
 ][i];}
T.register(25,{title:'Practical Mastery',kicker:'ONE VIEW PER REQUIRED PRACTICAL',description:'See setup, measurement, data, graph, uncertainty, Lab Book and evaluation mastery in one dashboard.',icon:'🧠',render,decorate({addPracticalButton,open}){addPracticalButton('mastery','Mastery',()=>open(25,{practicalId:current?.id||state.last}));}});
})();