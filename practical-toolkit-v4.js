(()=>{
'use strict';
if(window.__practicalToolkitV4Ready)return;
const CHALLENGES={
1:'Determine how resonant frequency depends on one chosen string variable while controlling the others.',
2:'Use interference/diffraction measurements to determine or test a wavelength/spacing relationship.',
3:'Determine g from free-fall measurements and a suitable linear graph.',
4:'Determine Young modulus from load, geometry and extension measurements.',
5:'Determine the resistivity of a wire from electrical and dimensional measurements.',
6:'Determine the emf and internal resistance of a cell from paired current and terminal-p.d. readings.',
7:'Investigate SHM using a pendulum or mass–spring system and a suitable transformed graph.',
8:'Test Boyle’s law or Charles’s law while controlling the required condition.',
9:'Determine the RC time constant from capacitor charge/discharge data, including a log-linear analysis.',
10:'Investigate how magnetic force depends on current, active wire length or flux density.',
11:'Investigate how flux linkage/emf varies with search-coil angle.',
12:'Test the inverse-square relationship using simulated gamma count-rate data with background correction.'
};
const PS=['PS1.1 practical problem solving','PS2.1 experimental design','PS2.2 data presentation','PS2.3 uncertainty and evaluation','PS2.4 variables and controls','PS3.1 graphs','PS3.2 data processing','PS3.3 accuracy and precision','PS4.1 instruments and techniques'];
let tab='instruments',logger=[],lastSample=0,scopePhase=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tkState(){state.toolkitV4=state.toolkitV4||{};const k=current?`${current.id}_${currentMode}`:'x';return state.toolkitV4[k]||(state.toolkitV4[k]={exam:false,teacher:false,scopeV:1,scopeT:1,meter:'auto'});}
function num(s){const m=String(s??'').replace('−','-').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);return m?+m[0]:NaN;}
function statData(){try{return getData()||[];}catch{return[];}}
function reg(d){
  d=d.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(d.length<2)return null;
  let n=d.length,sx=0,sy=0,sxx=0,sxy=0;d.forEach(p=>{sx+=p.x;sy+=p.y;sxx+=p.x*p.x;sxy+=p.x*p.y;});
  const den=n*sxx-sx*sx;if(Math.abs(den)<1e-15)return null;const m=(n*sxy-sx*sy)/den,c=(sy-m*sx)/n;
  const ym=sy/n,ssT=d.reduce((a,p)=>a+(p.y-ym)**2,0),ssR=d.reduce((a,p)=>a+(p.y-(m*p.x+c))**2,0);
  return {m,c,r2:ssT?1-ssR/ssT:1};
}
function repeatGroups(d){
  const map=new Map();d.forEach(p=>{const k=Number(p.x).toPrecision(7);if(!map.has(k))map.set(k,[]);map.get(k).push(p.y);});
  return [...map.entries()].map(([k,ys])=>{const min=Math.min(...ys),max=Math.max(...ys),mean=ys.reduce((a,b)=>a+b,0)/ys.length;return{x:+k,mean,half:(max-min)/2,n:ys.length};});
}
function estimateGradientUncertainty(d){
  const fit=reg(d),groups=repeatGroups(d).filter(g=>g.n>1);if(!fit||groups.length<2)return null;
  const a=groups[0],b=groups[groups.length-1],dx=b.x-a.x;if(!dx)return null;
  const steep=((b.mean+b.half)-(a.mean-a.half))/dx,shallow=((b.mean-b.half)-(a.mean+a.half))/dx;
  const worst=Math.abs(steep-fit.m)>Math.abs(shallow-fit.m)?steep:shallow;
  return {best:fit.m,worst,pct:Math.abs((fit.m-worst)/fit.m)*100};
}
function currentUncertainty(){
  const vals=getVals(),parts=current.vars.map((v,i)=>{const value=Math.abs(vals[i]),res=Math.abs(+v[5]||0),abs=res/2,pct=value?abs/value*100:0;return{name:typeof displayVarName==='function'?displayVarName(i):v[0],value,unit:v[1],res,abs,pct};});
  return parts;
}
function instrumentTypes(){
  const at=current.at||[],list=[];
  if(at.includes('ATa'))list.push(['analogue','Analogue scale','Read between scale markings and record an appropriate uncertainty.']);
  if(at.includes('ATb'))list.push(['digital','Digital meter','Select a suitable quantity/range and record displayed precision.']);
  if(at.includes('ATd'))list.push(['timer','Timer / light gate','Use a repeatable timing reference; electronic timing reduces reaction-time effects.']);
  if(at.includes('ATe'))list.push(['micro','Micrometer / calipers','Check zero, close gently in the simulation and read the small-distance scale.']);
  if(at.includes('ATh'))list.push(['scope','Oscilloscope','Adjust volts/division and time-base to display a useful trace.']);
  if(at.includes('ATk'))list.push(['logger','Data logger','Stream sensor values while the model runs and export/inspect the series.']);
  if(at.includes('ATj'))list.push(['optics','Optical bench','Check alignment and measure from a consistent reference plane.']);
  if(at.includes('ATl'))list.push(['counter','Radiation detector model','Use simulated count data, background correction and counting uncertainty.']);
  return list.length?list:[['analogue','Measurement tool','Choose an instrument whose resolution suits the measurement.']];
}
function readoutEntries(){try{return Object.entries(theoretical().read||{});}catch{return[];}}
function instrumentHTML(){
  const t=tkState(),entries=readoutEntries(),types=instrumentTypes();
  return `<div class="tk-instruments">${types.map(([id,name,note])=>`<article class="tk-instrument" data-inst="${id}"><div><span class="tk-icon">${id==='scope'?'∿':id==='micro'?'⌖':id==='digital'?'▣':'◫'}</span><b>${esc(name)}</b></div><p>${esc(note)}</p>${id==='digital'?`<label>Display <select id="tkMeterSelect">${entries.map(([k])=>`<option>${esc(k)}</option>`).join('')}</select></label><output id="tkMeterOut">${esc(entries[0]?.[1]||'—')}</output>`:''}${id==='micro'?microHTML():''}${id==='scope'?scopeHTML(t):''}${id==='logger'?`<div class="tk-logger"><b>${logger.length} samples</b><button id="tkClearLogger">Clear logger</button><div id="tkLoggerLast">${logger.length?esc(logger[logger.length-1].label):'Run the experiment to collect samples.'}</div></div>`:''}${id==='counter'?`<small>Simulation only — no source-handling instructions are provided.</small>`:''}</article>`).join('')}</div>`;
}
function microHTML(){
  const vals=getVals();let i=current.vars.findIndex(v=>/diameter|small|wire/i.test(v[0])&&/mm|m/.test(v[1]||''));if(i<0)i=Math.min(2,vals.length-1);
  const v=vals[i],spec=current.vars[i],mm=(spec[1]==='m'?v*1000:v),zero=0.01,shown=mm+zero;
  const main=Math.floor(shown*2)/2,th=Math.round((shown-main)*100);
  return `<div class="micro-face"><span>Sleeve ${main.toFixed(2)} mm</span><span>Thimble ${String(th).padStart(2,'0')}</span><b>${shown.toFixed(2)} mm</b><small>Example +0.01 mm zero error → corrected ${mm.toFixed(2)} mm</small></div>`;
}
function scopeHTML(t){return `<div class="scope-face"><canvas id="tkScope" width="420" height="160"></canvas><div><label>V/div <input id="tkScopeV" type="range" min=".2" max="5" step=".2" value="${t.scopeV}"></label><label>time-base <input id="tkScopeT" type="range" min=".2" max="5" step=".2" value="${t.scopeT}"></label></div></div>`;}
function drawScope(){
  const c=document.querySelector('#tkScope');if(!c)return;const x=c.getContext('2d'),t=tkState();x.clearRect(0,0,c.width,c.height);x.strokeStyle='#9aa8a2';x.lineWidth=.5;
  for(let i=0;i<=10;i++){x.beginPath();x.moveTo(i*c.width/10,0);x.lineTo(i*c.width/10,c.height);x.stroke();}
  for(let i=0;i<=8;i++){x.beginPath();x.moveTo(0,i*c.height/8);x.lineTo(c.width,i*c.height/8);x.stroke();}
  const amp=Math.min(c.height*.36,45/(+t.scopeV||1)),freq=(current?.id===11?2.4:1.4)*(+t.scopeT||1);x.strokeStyle='#d3eca6';x.lineWidth=2;x.beginPath();
  for(let px=0;px<c.width;px++){const y=c.height/2-amp*Math.sin(scopePhase+px/c.width*Math.PI*2*freq);px?x.lineTo(px,y):x.moveTo(px,y);}x.stroke();
}
function uncertaintyHTML(){
  const p=currentUncertainty(),d=statData(),groups=repeatGroups(d),grad=estimateGradientUncertainty(d);
  const rep=groups.filter(g=>g.n>1);const avgHalf=rep.length?rep.reduce((a,g)=>a+Math.abs(g.half),0)/rep.length:0;
  return `<div class="tk-uncertainty"><div class="tk-metrics">${p.map(q=>`<div><small>${esc(q.name)}</small><b>± ${q.abs.toPrecision(2)} ${esc(q.unit||'')}</b><span>${q.pct.toFixed(2)}% from ½ resolution</span></div>`).join('')}</div>
  <div class="tk-rule-card"><b>AQA measurement treatment</b><p>Use absolute/fractional/percentage uncertainties appropriately. For repeated readings, a half-range can be used as a simple uncertainty estimate; graph uncertainty can be explored with a worst acceptable gradient.</p></div>
  <div class="tk-metrics"><div><small>Repeated sets</small><b>${rep.length}</b><span>${rep.length?`Mean half-range ${fmtN(avgHalf)}`:'Take repeats at the same setting.'}</span></div><div><small>Gradient uncertainty</small><b>${grad?grad.pct.toFixed(1)+'%':'—'}</b><span>${grad?`best ${fmtN(grad.best)} · worst ${fmtN(grad.worst)}`:'Needs repeated points at ≥2 x-values.'}</span></div><div><small>Power rule reminder</small><b>${current.id===4||current.id===5||current.id===8?'diameter² → ×2 %':'Use expression powers'}</b><span>Percentage uncertainty is multiplied by the power for a powered quantity.</span></div></div></div>`;
}
function fmtN(n){if(!Number.isFinite(n))return'—';const a=Math.abs(n);return a&& (a<.001||a>9999)?n.toExponential(2):n.toFixed(a<10?3:2);}
function graphHTML(){
  const d=statData(),fit=reg(d),g=estimateGradientUncertainty(d);
  return `<div class="tk-graph"><canvas id="tkGraph" width="760" height="300"></canvas><div class="tk-metrics"><div><small>Points</small><b>${d.length}</b><span>${new Set(d.map(p=>p.x.toPrecision(6))).size} independent-variable values</span></div><div><small>Best-fit gradient</small><b>${fit?fmtN(fit.m):'—'}</b><span>${fit?'R² '+fit.r2.toFixed(3):'Record at least two points.'}</span></div><div><small>Worst-line estimate</small><b>${g?fmtN(g.worst):'—'}</b><span>${g?g.pct.toFixed(1)+'% gradient uncertainty':'Take repeats at ≥2 settings.'}</span></div></div><p class="tk-hint">Axes: ${esc(current.x)} against ${esc(current.y)}. Use a wide sensible range and inspect anomalies before interpreting the fit.</p></div>`;
}
function drawGraph(){
  const c=document.querySelector('#tkGraph');if(!c)return;const d=statData().filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  if(!d.length){ctx.fillStyle='#71817a';ctx.font='14px sans-serif';ctx.fillText('Record readings to analyse the graph.',30,50);return;}
  const pad=42,xs=d.map(p=>p.x),ys=d.map(p=>p.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),dx=xmax-xmin||1,dy=ymax-ymin||1;
  const X=x=>pad+(x-xmin)/dx*(c.width-2*pad),Y=y=>c.height-pad-(y-ymin)/dy*(c.height-2*pad);
  ctx.strokeStyle='#9aa8a2';ctx.beginPath();ctx.moveTo(pad,10);ctx.lineTo(pad,c.height-pad);ctx.lineTo(c.width-10,c.height-pad);ctx.stroke();
  const groups=repeatGroups(d);ctx.strokeStyle='#6b7d75';groups.forEach(g=>{if(g.half){ctx.beginPath();ctx.moveTo(X(g.x),Y(g.mean-g.half));ctx.lineTo(X(g.x),Y(g.mean+g.half));ctx.stroke();}});
  ctx.fillStyle='#234e40';d.forEach(p=>{ctx.fillRect(X(p.x)-2,Y(p.y)-2,5,5);});const f=reg(d);if(f){ctx.strokeStyle='#d17d38';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(xmin),Y(f.m*xmin+f.c));ctx.lineTo(X(xmax),Y(f.m*xmax+f.c));ctx.stroke();}
}
function feedback(){
  const d=statData(),unique=new Set(d.map(p=>Number(p.x).toPrecision(6))).size,groups=repeatGroups(d),reps=groups.filter(g=>g.n>1).length,sv=window.__AQA_SANDBOX_V4?.validate?.()||{score:0,ready:false};
  const fit=reg(d),notes=[];
  if(!sv.ready)notes.push('Finish the apparatus connections/calibration checks.');
  if(unique<5)notes.push('Use a wider set of independent-variable values (aim for at least five well-spaced settings).');
  if(reps<2)notes.push('Repeat measurements at more than one setting so random spread can be estimated.');
  if(!fit)notes.push('Record enough points for a graph and gradient.');
  if(current.id===12)notes.push('Check that the simulated background count is treated separately from the source count.');
  if(current.id===4||current.id===5)notes.push('Treat diameter carefully because cross-sectional area depends on diameter squared.');
  return {setup:sv.score,unique,reps,fit,notes:notes.length?notes:['The simulated workflow has good setup, range, repeats and graph evidence. Now focus on explaining limitations and improvements.']};
}
function challengeHTML(){
  const t=tkState(),f=feedback(),sandbox=window.__AQA_SANDBOX_V4?.session?.();
  return `<div class="tk-challenge"><div class="challenge-brief"><span>AQA PRACTICAL CHALLENGE</span><h4>${esc(CHALLENGES[current.id])}</h4><p>Plan → build → calibrate → measure → repeat → graph → evaluate. The simulation is practice; Practical Endorsement competency is assessed by staff through real practical work.</p><button id="tkExamToggle" class="${t.exam?'active':''}">${t.exam?'Exit exam view':'Start exam view'}</button></div>
  <div class="tk-metrics"><div><small>Setup</small><b>${f.setup}%</b><span>${sandbox?.mode==='challenge'?'Challenge validation active':'Switch the sandbox to Challenge for setup gating.'}</span></div><div><small>Range</small><b>${f.unique} values</b><span>Distinct independent-variable settings</span></div><div><small>Repeat sets</small><b>${f.reps}</b><span>Settings with repeated y readings</span></div></div>
  <button id="tkMarkProcess">Review my process</button><div id="tkFeedback"></div></div>`;
}
function teacherHTML(){
  return `<div class="tk-teacher"><div class="tk-rule-card"><b>Teacher / demonstration tools</b><p>Generate a clean teaching dataset, reset an attempt, or place the sandbox into a diagnostic-fault activity. These controls do not award the Practical Endorsement.</p></div><div class="tk-teacher-actions"><button id="tkDataset">Generate 6-point model dataset</button><button id="tkFault">Set diagnostic fault</button><button id="tkResetAttempt">Reset this practical attempt</button></div><div class="tk-cpac"><h4>AQA apparatus/skills coverage</h4><div>${(current.at||[]).map(a=>`<span>${esc(a)}</span>`).join('')}${PS.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div>`;
}
function tabHTML(){
  if(tab==='instruments')return instrumentHTML();
  if(tab==='uncertainty')return uncertaintyHTML();
  if(tab==='graph')return graphHTML();
  if(tab==='challenge')return challengeHTML();
  return teacherHTML();
}
function render(){
  if(!current)return;const sb=document.querySelector('#experimentalSandboxV4'),anchor=sb||document.querySelector('.workbench');if(!anchor)return;
  let el=document.querySelector('#practicalToolkitV4');if(!el){el=document.createElement('details');el.id='practicalToolkitV4';el.className='toolkit-v4';anchor.after(el);}
  el.innerHTML=`<summary><span><b>Lab tools</b><small>Instruments · uncertainty · graph · challenge · teacher</small></span><span>Open tools</span></summary><div class="tk-shell"><nav class="tk-tabs">${[['instruments','Instruments'],['uncertainty','Uncertainty'],['graph','Graph'],['challenge','Challenge'],['teacher','Teacher']].map(([k,n])=>`<button data-tk-tab="${k}" class="${tab===k?'active':''}">${n}</button>`).join('')}</nav><div id="tkBody">${tabHTML()}</div></div>`;
  bind(el);afterRender();
}
function bind(el){
  el.querySelectorAll('[data-tk-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tkTab;render();});
  const meter=el.querySelector('#tkMeterSelect');if(meter)meter.onchange=()=>{const entry=readoutEntries().find(([k])=>k===meter.value);el.querySelector('#tkMeterOut').textContent=entry?.[1]||'—';};
  const cv=el.querySelector('#tkScopeV'),ct=el.querySelector('#tkScopeT');if(cv)cv.oninput=()=>{tkState().scopeV=+cv.value;save();drawScope();};if(ct)ct.oninput=()=>{tkState().scopeT=+ct.value;save();drawScope();};
  const clr=el.querySelector('#tkClearLogger');if(clr)clr.onclick=()=>{logger=[];render();};
  const exam=el.querySelector('#tkExamToggle');if(exam)exam.onclick=()=>{const t=tkState();t.exam=!t.exam;save();applyExam();render();};
  const mark=el.querySelector('#tkMarkProcess');if(mark)mark.onclick=()=>{const f=feedback(),box=el.querySelector('#tkFeedback');box.innerHTML=`<div class="tk-feedback"><b>Process review</b><ul>${f.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`;};
  const ds=el.querySelector('#tkDataset');if(ds)ds.onclick=generateDataset;
  const fault=el.querySelector('#tkFault');if(fault)fault.onclick=()=>{window.__AQA_SANDBOX_V4?.session&&(window.__AQA_SANDBOX_V4.session().mode='challenge');document.querySelector('#experimentalSandboxV4 [data-sb-fault]')?.click();render();};
  const reset=el.querySelector('#tkResetAttempt');if(reset)reset.onclick=resetAttempt;
}
function afterRender(){drawScope();drawGraph();applyExam();}
function applyExam(){document.body.classList.toggle('exam-mode-v4',!!current&&tkState().exam);}
function generateDataset(){
  const d=statData();d.length=0;const vals=getVals().slice(),idx=({1:0,2:1,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0}[current.id]??0),spec=current.vars[idx],orig=vals[idx];
  for(let i=0;i<6;i++){vals[idx]=spec[2]+(spec[3]-spec[2])*i/5;const p=theoretical(vals);for(let r=0;r<3;r++){const noise=(Math.random()-.5)*.012;d.push({x:p.x,y:p.y*(1+noise),rep:r+1});}}
  vals[idx]=orig;save();try{renderData();}catch{}render();
}
function resetAttempt(){
  try{const d=statData();d.length=0;}catch{}logger=[];window.__AQA_SANDBOX_V4?.clearSetup?.();const t=tkState();t.exam=false;save();applyExam();try{renderData();}catch{}render();
}
function onFrame(e){
  if(!current)return;scopePhase+=(e.detail?.dt||.016)*4;
  const now=performance.now();if(now-lastSample>180){lastSample=now;try{const first=readoutEntries()[0];if(first){logger.push({t:simT,label:`${simT.toFixed(2)} s · ${first[0]} ${first[1]}`});if(logger.length>80)logger.shift();}}catch{}}
  if(document.querySelector('#tkScope'))drawScope();
}
const priorRender=window.renderPractical;if(typeof priorRender==='function')window.renderPractical=function(){const r=priorRender.apply(this,arguments);queueMicrotask(render);return r;};
const priorData=window.renderData;if(typeof priorData==='function')window.renderData=function(){const r=priorData.apply(this,arguments);if(document.querySelector('#practicalToolkitV4[open]'))queueMicrotask(render);return r;};
window.addEventListener('practicallab:frame',onFrame);
window.__practicalToolkitV4={version:'4.0',render,feedback,estimateGradientUncertainty};
window.__practicalToolkitV4Ready=true;if(current)queueMicrotask(render);
})();