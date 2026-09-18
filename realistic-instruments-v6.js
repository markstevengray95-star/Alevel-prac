(()=>{
'use strict';
if(window.__realisticInstrumentsV6Ready)return;
const NS='http://www.w3.org/2000/svg';
const priorFrameHook=window.__sandboxEnhanceFrame;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,f=0)=>{const m=String(v??'').replace('−','-').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);return m?+m[0]:f;};
const state={
  meterRanges:{},scopeVdiv:.5,scopeTimeMs:5,scopeTrigger:0,
  micZero:{4:.01,5:.01,8:.02},panel:null,leadDrag:null
};
const meterRanges={A:[.2,2,10],V:[.2,2,20]};
const instrumentParts=new Set(['Ammeter','Voltmeter','Micrometer','Vernier scale','Oscilloscope','Data logger','Timer','Thermometer','Top-pan balance']);
const leadDefs={
  5:['Voltmeter','Resistance wire','Voltmeter lead'],
  6:['Voltmeter','Cell','Cell p.d. lead'],
  9:['Voltmeter','Capacitor','Capacitor p.d. lead'],
  10:['Ammeter','Straight wire','Series current lead'],
  11:['Oscilloscope','Search coil','Search-coil lead']
};
function safeTheory(){try{return theoretical()||{read:{}};}catch{return{read:{}};}}
function safeVals(){try{return getVals()||[];}catch{return[];}}
function ensureDefs(svg){
  let defs=svg.querySelector('defs');if(!defs){defs=document.createElementNS(NS,'defs');svg.insertBefore(defs,svg.firstChild);}
  if(defs.querySelector('#v6FaceGlow'))return;
  defs.insertAdjacentHTML('beforeend',`
    <filter id="v6FaceGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="v6Chrome" x1="0" x2="1"><stop stop-color="#f7fbf9"/><stop offset=".22" stop-color="#9faeaa"/><stop offset=".5" stop-color="#eef5f2"/><stop offset=".76" stop-color="#65736e"/><stop offset="1" stop-color="#d8e0dd"/></linearGradient>
    <linearGradient id="v6Glass" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#effff4" stop-opacity=".9"/><stop offset=".45" stop-color="#acd39f" stop-opacity=".72"/><stop offset="1" stop-color="#6d9270" stop-opacity=".65"/></linearGradient>
  `);
}
function getLayer(svg){let g=svg.querySelector('#instrumentRealismV6');if(!g){g=document.createElementNS(NS,'g');g.id='instrumentRealismV6';g.setAttribute('aria-hidden','true');svg.appendChild(g);}return g;}
function bbox(el){try{return el?.getBBox?.()||null;}catch{return null;}}
function pointFor(el,where='center'){const b=bbox(el);if(!b)return null;const x=where==='left'?b.x:where==='right'?b.x+b.width:b.x+b.width/2;const y=where==='top'?b.y:where==='bottom'?b.y+b.height:b.y+b.height/2;return{x,y};}
function screenNumber(el){const t=el?.querySelector('text[font-family="monospace"]');return num(t?.textContent,0);}
function meterType(el){return el?.dataset.part==='Ammeter'?'A':'V';}
function meterRange(id,type,value){
  const key=`${current?.id||0}:${type}`,opts=meterRanges[type]||[1],saved=state.meterRanges[key];
  if(saved)return saved;
  return opts.find(r=>Math.abs(value)<=r*.92)||opts[opts.length-1];
}
function meterOverlay(el,i){
  const b=bbox(el);if(!b)return'';const type=meterType(el),value=screenNumber(el),range=meterRange(i,type,value),ratio=clamp(Math.abs(value)/range,0,1);
  const cx=b.x+b.width*.5,cy=b.y+b.height*.64,r=Math.min(b.width,b.height)*.16;
  let ticks='';for(let k=0;k<9;k++){const a=(-120+k*30)*Math.PI/180,x1=cx+Math.cos(a)*r*.72,y1=cy+Math.sin(a)*r*.72,x2=cx+Math.cos(a)*r*.93,y2=cy+Math.sin(a)*r*.93;ticks+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;}
  const a=(-120+240*ratio)*Math.PI/180,nx=cx+Math.cos(a)*r*.78,ny=cy+Math.sin(a)*r*.78;
  return `<g class="v6-meter" data-v6-meter="${i}"><g class="v6-meter-ticks">${ticks}</g><line class="v6-meter-needle" x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}"/><circle class="v6-meter-pivot" cx="${cx}" cy="${cy}" r="3.2"/><text class="v6-range-label" x="${cx}" y="${b.y+b.height*.47}" text-anchor="middle">${range} ${type}</text><circle class="v6-binding red" cx="${b.x+b.width*.22}" cy="${b.y+b.height*.88}" r="6"/><circle class="v6-binding black" cx="${b.x+b.width*.78}" cy="${b.y+b.height*.88}" r="6"/></g>`;
}
function micrometerValue(){
  const v=safeVals();
  if(current?.id===4||current?.id===5)return num(v[2]);
  if(current?.id===8&&currentMode===0){const area=.00032;return Math.sqrt(4*area/Math.PI)*1000;}
  return 0;
}
function microOverlay(el){
  const b=bbox(el),actual=micrometerValue();if(!b||!actual)return'';
  const zero=state.micZero[current.id]||0,indicated=actual+zero,main=Math.floor(indicated*2)/2,thimble=Math.round((indicated-main)*100);
  let sleeve='',th='';for(let i=0;i<10;i++){const x=b.x+b.width*(.48+i*.045),y=b.y+b.height*.58;sleeve+=`<line x1="${x}" y1="${y}" x2="${x}" y2="${y+(i%2?7:11)}"/>`;}
  for(let i=0;i<8;i++){const y=b.y+b.height*(.37+i*.045),x=b.x+b.width*.82;th+=`<line x1="${x}" y1="${y}" x2="${x+10+(i%2?0:4)}" y2="${y}"/>`;}
  return `<g class="v6-micro"><g class="v6-micro-sleeve">${sleeve}</g><g class="v6-micro-thimble">${th}</g><line class="v6-micro-index" x1="${b.x+b.width*.47}" y1="${b.y+b.height*.55}" x2="${b.x+b.width*.94}" y2="${b.y+b.height*.55}"/><rect class="v6-read-tag" x="${b.x+b.width*.44}" y="${b.y-7}" width="${b.width*.55}" height="19" rx="7"/><text class="v6-read-text" x="${b.x+b.width*.715}" y="${b.y+6}" text-anchor="middle">${indicated.toFixed(2)} mm · ${String(thimble).padStart(2,'0')}</text></g>`;
}
function vernierOverlay(el,th){
  const b=bbox(el);if(!b)return'';const ext=num(th.read?.Extension),res=.02,rounded=Math.round(ext/res)*res,frac=(rounded%1+1)%1,cx=b.x+16+frac*Math.max(20,b.width-34);
  let ticks='';for(let i=0;i<=10;i++){const x=cx-20+i*4;ticks+=`<line x1="${x}" y1="${b.y+b.height*.25}" x2="${x}" y2="${b.y+b.height*(i%5===0?.83:.67)}"/>`;}
  return `<g class="v6-vernier"><line class="v6-vernier-hair" x1="${cx}" y1="${b.y-8}" x2="${cx}" y2="${b.y+b.height+8}"/><g class="v6-vernier-ticks">${ticks}</g><rect class="v6-read-tag" x="${b.x+8}" y="${b.y-23}" width="${Math.min(112,b.width-10)}" height="18" rx="7"/><text class="v6-read-text" x="${b.x+63}" y="${b.y-10}" text-anchor="middle">${ext.toFixed(3)} mm</text></g>`;
}
function scopeOverlay(el,th){
  const b=bbox(el);if(!b)return'';const emf=Math.abs(num(th.read?.EMF)),freq=Math.max(1,num(th.read?.Frequency,50));
  const sx=b.x+b.width*.09,sy=b.y+b.height*.13,sw=b.width*.81,sh=b.height*.63,mid=sy+sh/2;
  const amp=clamp(emf/Math.max(.05,state.scopeVdiv)*(sh/8),2,sh*.44),span=state.scopeTimeMs*10/1000,cycles=clamp(freq*span,.5,8);
  let pts=[];for(let i=0;i<=100;i++){const x=sx+sw*i/100,y=mid-amp*Math.sin(i/100*Math.PI*2*cycles+(typeof simT==='number'?simT:0)*freq*Math.PI*2);pts.push(`${x},${y}`);}
  return `<g class="v6-scope"><rect class="v6-screen-glass" x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="5"/><polyline class="v6-scope-trace" points="${pts.join(' ')}"/><path class="v6-trigger" d="M${sx+4} ${mid-8} l8 8 -8 8z"/><text class="v6-scope-scale" x="${sx+7}" y="${sy+13}">${state.scopeVdiv.toFixed(1)} V/div</text><text class="v6-scope-scale" x="${sx+sw-7}" y="${sy+13}" text-anchor="end">${state.scopeTimeMs} ms/div</text></g>`;
}
function gateOverlay(svg,th){
  if(current?.id!==3)return'';const time=th.read?.Time||'—',t=(typeof simT==='number'?simT:0),frac=((t%1.8)+1.8)%1.8/1.8,yy=running?105+Math.min(1,frac*1.25)**2*205:105;
  const top=Math.abs(yy-158)<14,bottom=Math.abs(yy-290)<14;
  return `<g class="v6-gates"><circle class="v6-gate-led ${top?'hit':''}" cx="180" cy="158" r="5"/><circle class="v6-gate-led ${bottom?'hit':''}" cx="180" cy="290" r="5"/><rect class="v6-logger-window" x="404" y="188" width="107" height="28" rx="4"/><text class="v6-logger-digits" x="457" y="207" text-anchor="middle">${time}</text><text class="v6-gate-status" x="457" y="224" text-anchor="middle">${bottom?'STOP':top?'START':'ARMED'}</text></g>`;
}
function switchOverlay(svg,th){
  if(![6,9].includes(current?.id))return'';const el=svg.querySelector('[data-part="Switch"],[data-part="Two-position switch"]'),b=bbox(el);if(!b)return'';
  const on=!!running;return `<g class="v6-switch"><circle class="v6-contact ${on?'on':''}" cx="${b.x+b.width*.18}" cy="${b.y+b.height*.5}" r="8"/><circle class="v6-contact ${on?'on':''}" cx="${b.x+b.width*.82}" cy="${b.y+b.height*.5}" r="8"/><text class="v6-switch-state" x="${b.x+b.width/2}" y="${b.y-7}" text-anchor="middle">${on?'CLOSED':'OPEN'}</text></g>`;
}
function thermometerOverlay(svg,th){
  if(current?.id!==8||currentMode!==1)return'';const el=svg.querySelector('[data-part="Thermometer"]'),b=bbox(el);if(!b)return'';const temp=num(th.read?.Temperature),fill=clamp((temp+5)/105,0,1);
  return `<g class="v6-thermometer"><rect class="v6-thermo-glass" x="${b.x+b.width*.37}" y="${b.y+5}" width="${b.width*.26}" height="${b.height*.82}" rx="5"/><rect class="v6-thermo-fluid" x="${b.x+b.width*.43}" y="${b.y+8+(1-fill)*b.height*.76}" width="${b.width*.14}" height="${Math.max(4,fill*b.height*.76)}" rx="3"/><text class="v6-read-text" x="${b.x+b.width/2}" y="${b.y-8}" text-anchor="middle">${temp.toFixed(0)} °C</text></g>`;
}
function anchors(svg){
  const d=leadDefs[current?.id];if(!d)return null;const a=svg.querySelector(`[data-part="${CSS.escape(d[0])}"]`),b=svg.querySelector(`[data-part="${CSS.escape(d[1])}"]`);if(!a||!b)return null;
  const pa=pointFor(a,'center'),pb=pointFor(b,'center');if(!pa||!pb)return null;
  return{from:pa,to:pb,label:d[2]};
}
function leadOverlay(svg){
  const a=anchors(svg);if(!a)return'';const drag=state.leadDrag&&state.leadDrag.id===current.id?state.leadDrag:null,p=drag?.point||a.to;
  const mx=(a.from.x+p.x)/2,curve=`M${a.from.x} ${a.from.y} C${mx} ${a.from.y+30} ${mx} ${p.y-30} ${p.x} ${p.y}`;
  return `<g class="v6-lead-practice"><path class="v6-lead-shadow" d="${curve}"/><path class="v6-lead-wire ${drag?'dragging':''}" d="${curve}"/><circle class="v6-lead-socket" cx="${a.from.x}" cy="${a.from.y}" r="7"/><circle class="v6-lead-handle" data-v6-lead-handle="1" cx="${p.x}" cy="${p.y}" r="10"/>${drag?`<text class="v6-lead-label" x="${p.x+13}" y="${p.y-10}">${a.label}</text>`:''}</g>`;
}
function markInstruments(svg){
  svg.querySelectorAll('[data-part]').forEach(el=>{if(instrumentParts.has(el.dataset.part))el.setAttribute('data-v6-instrument','1');});
}
function renderRealism(detail={}){
  try{if(typeof priorFrameHook==='function')priorFrameHook(detail);}catch(e){console.warn('v5 visual hook failed',e);}
  const scene=document.querySelector('#scene'),svg=scene?.querySelector('svg');if(!scene||!svg||!current)return;
  ensureDefs(svg);markInstruments(svg);const th=safeTheory(),layer=getLayer(svg);let html='';
  [...svg.querySelectorAll('[data-part="Ammeter"],[data-part="Voltmeter"]')].forEach((el,i)=>html+=meterOverlay(el,i));
  svg.querySelectorAll('[data-part="Micrometer"]').forEach(el=>html+=microOverlay(el));
  const ver=svg.querySelector('[data-part="Vernier scale"]');if(ver)html+=vernierOverlay(ver,th);
  const scope=svg.querySelector('[data-part="Oscilloscope"]');if(scope)html+=scopeOverlay(scope,th);
  html+=gateOverlay(svg,th)+switchOverlay(svg,th)+thermometerOverlay(svg,th)+leadOverlay(svg);
  layer.innerHTML=html;scene.dataset.instrumentLayer='v6';scene.classList.toggle('v6-instrument-active',!!state.panel);
  updatePanel();
}
function workbench(){return document.querySelector('.workbench');}
function removePanel(){state.panel=null;document.querySelector('#instrumentPopoverV6')?.remove();document.querySelector('#scene')?.classList.remove('v6-instrument-active');}
function readingFor(part){
  const th=safeTheory(),r=th.read||{};
  if(part==='Ammeter')return r.Current||'—';
  if(part==='Voltmeter')return r.Voltage||r.Terminal||r.EMF||'—';
  if(part==='Micrometer'){const a=micrometerValue(),z=state.micZero[current.id]||0;return`${(a+z).toFixed(2)} mm indicated`;}
  if(part==='Vernier scale')return r.Extension||'—';
  if(part==='Oscilloscope')return r.EMF||'—';
  if(part==='Data logger'||part==='Timer')return r.Time||r.Total||r.Period||'—';
  if(part==='Thermometer')return r.Temperature||'—';
  if(part==='Top-pan balance')return r.Balance||'—';
  return'—';
}
function panelBody(part){
  const value=readingFor(part);
  if(part==='Ammeter'||part==='Voltmeter'){
    const type=part==='Ammeter'?'A':'V',raw=num(value),key=`${current.id}:${type}`,range=meterRange(0,type,raw);
    return `<div class="v6-pop-reading"><small>LIVE READING</small><b data-v6-live>${value}</b></div><label>Range<select data-v6-range="${type}">${meterRanges[type].map(v=>`<option value="${v}" ${v===range?'selected':''}>${v} ${type}</option>`).join('')}</select></label><p>Choose the smallest suitable range without over-ranging. The numerical model is unchanged; the instrument display resolution changes.</p>`;
  }
  if(part==='Micrometer'){
    const actual=micrometerValue(),z=state.micZero[current.id]||0,ind=actual+z;
    return `<div class="v6-pop-reading"><small>INDICATED</small><b data-v6-live>${ind.toFixed(2)} mm</b></div><div class="v6-mini-grid"><span>Zero error<b>${z>=0?'+':''}${z.toFixed(2)} mm</b></span><span>Corrected<b>${actual.toFixed(2)} mm</b></span></div><button data-v6-zero>Zero instrument</button><p>Close gently, check the zero, then subtract any zero error from the indicated reading.</p>`;
  }
  if(part==='Vernier scale')return `<div class="v6-pop-reading"><small>VERNIER READING</small><b data-v6-live>${value}</b></div><p>The magnified cursor shows the main-scale position and vernier coincidence. Read at eye level and use the same reference each time.</p>`;
  if(part==='Oscilloscope')return `<div class="v6-pop-reading"><small>INDUCED EMF</small><b data-v6-live>${value}</b></div><label>V/div <input data-v6-scope-v type="range" min=".1" max="2" step=".1" value="${state.scopeVdiv}"><output>${state.scopeVdiv.toFixed(1)}</output></label><label>Time/div <input data-v6-scope-t type="range" min="1" max="20" step="1" value="${state.scopeTimeMs}"><output>${state.scopeTimeMs} ms</output></label><p>Adjust vertical sensitivity and time-base until the trace fills the screen without clipping.</p>`;
  if(part==='Data logger'||part==='Timer')return `<div class="v6-pop-reading"><small>ELECTRONIC TIMING</small><b data-v6-live>${value}</b></div><p>The gate LEDs change state as the object crosses each beam. Electronic timing removes most human reaction-time error.</p>`;
  if(part==='Thermometer')return `<div class="v6-pop-reading"><small>BATH TEMPERATURE</small><b data-v6-live>${value}</b></div><p>Read the liquid column at eye level after the gas sample has reached thermal equilibrium.</p>`;
  if(part==='Top-pan balance')return `<div class="v6-pop-reading"><small>BALANCE CHANGE</small><b data-v6-live>${value}</b></div><p>Use the zero/tare reference consistently and allow the reading to settle before recording.</p>`;
  return `<div class="v6-pop-reading"><b>${value}</b></div>`;
}
function openPanel(part){
  state.panel={id:current.id,mode:currentMode,part};let p=document.querySelector('#instrumentPopoverV6');if(!p){p=document.createElement('aside');p.id='instrumentPopoverV6';p.className='instrument-popover-v6';workbench()?.appendChild(p);}updatePanel(true);
}
function updatePanel(force=false){
  const p=document.querySelector('#instrumentPopoverV6');if(!state.panel){p?.remove();return;}
  if(!current||state.panel.id!==current.id||state.panel.mode!==currentMode){removePanel();return;}
  const part=state.panel.part;if(!p)return;
  if(!force&&p.dataset.part===part){const live=p.querySelector('[data-v6-live]');if(live)live.textContent=readingFor(part);return;}
  p.dataset.part=part;
  p.innerHTML=`<button class="v6-pop-close" aria-label="Close instrument detail">×</button><div class="v6-pop-head"><span>INSTRUMENT FOCUS</span><h4>${part}</h4></div>${panelBody(part)}`;
}
function svgPoint(e){const svg=document.querySelector('#scene svg');if(!svg)return null;const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*900,y:(e.clientY-r.top)/r.height*430};}
function toast(msg){const scene=document.querySelector('#scene');if(!scene)return;let n=scene.querySelector('.interaction-toast');if(!n){n=document.createElement('div');n.className='interaction-toast';scene.appendChild(n);}n.textContent=msg;n.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>n?.classList.remove('show'),1200);}
function onPointerDown(e){
  const handle=e.target.closest?.('[data-v6-lead-handle]');if(handle){e.preventDefault();e.stopPropagation();const p=svgPoint(e);if(p){state.leadDrag={id:current.id,point:p};document.body.classList.add('lab-dragging');renderRealism({lead:true});toast('Lead unplugged — drag the plug back onto the correct connector');}return;}
}
function onPointerMove(e){if(!state.leadDrag)return;const p=svgPoint(e);if(!p)return;state.leadDrag.point=p;renderRealism({lead:true});}
function onPointerUp(){if(!state.leadDrag)return;const svg=document.querySelector('#scene svg'),a=svg&&anchors(svg),p=state.leadDrag.point;let ok=false;if(a&&p)ok=Math.hypot(p.x-a.to.x,p.y-a.to.y)<55;state.leadDrag=null;document.body.classList.remove('lab-dragging');renderRealism({lead:false});toast(ok?'Connector snapped securely into the correct terminal':'Lead returned to the correct circuit connection');}
function onClick(e){
  if(e.target.closest?.('.v6-pop-close')){removePanel();return;}
  const z=e.target.closest?.('[data-v6-zero]');if(z&&current){state.micZero[current.id]=0;updatePanel(true);window.__animationRuntime?.requestPaint?.();return;}
  const inst=e.target.closest?.('[data-v6-instrument]');if(inst){e.stopPropagation();openPanel(inst.dataset.part);}
}
function onInput(e){
  if(e.target.matches('[data-v6-range]')){const type=e.target.dataset.v6Range,key=`${current.id}:${type}`;state.meterRanges[key]=+e.target.value;window.__animationRuntime?.requestPaint?.();updatePanel();}
  if(e.target.matches('[data-v6-scope-v]')){state.scopeVdiv=+e.target.value;e.target.nextElementSibling.textContent=state.scopeVdiv.toFixed(1);renderRealism({scope:true});}
  if(e.target.matches('[data-v6-scope-t]')){state.scopeTimeMs=+e.target.value;e.target.nextElementSibling.textContent=state.scopeTimeMs+' ms';renderRealism({scope:true});}
}
function bind(){
  const scene=document.querySelector('#scene');if(scene&&!scene.dataset.v6Bound){scene.dataset.v6Bound='1';scene.addEventListener('pointerdown',onPointerDown);scene.addEventListener('click',onClick);}
  const wb=workbench();if(wb&&!wb.dataset.v6Bound){wb.dataset.v6Bound='1';wb.addEventListener('click',onClick);wb.addEventListener('input',onInput);wb.addEventListener('change',onInput);}
}
window.addEventListener('pointermove',onPointerMove,{passive:true});
window.addEventListener('pointerup',onPointerUp);
window.addEventListener('pointercancel',onPointerUp);
const oldOpen=typeof openPractical==='function'?openPractical:null;
if(oldOpen)openPractical=function(id){removePanel();state.leadDrag=null;const out=oldOpen(id);setTimeout(()=>{bind();renderRealism({open:true});},0);return out;};
window.__sandboxEnhanceFrame=function(detail={}){bind();renderRealism(detail);};
window.__realisticInstrumentsV6={version:'6.0',refresh:renderRealism,open:openPanel,state};
window.__realisticInstrumentsV6Ready=true;
setTimeout(()=>{bind();renderRealism({initial:true});},0);
})();