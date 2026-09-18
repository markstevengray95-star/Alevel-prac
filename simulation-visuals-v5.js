(()=>{
'use strict';
if(window.__simulationVisualsV5Ready)return;
const NS='http://www.w3.org/2000/svg';
const priorFrameHook=window.__sandboxEnhanceFrame;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const n=(x,f=0)=>{const v=parseFloat(x);return Number.isFinite(v)?v:f;};
const safeVals=()=>{try{return getVals();}catch{return[];}};
const safeTheory=()=>{try{return theoretical()||{read:{}};}catch{return{read:{}};}};
function ensureDefs(svg){
  const defs=svg.querySelector('defs')||svg.insertBefore(document.createElementNS(NS,'defs'),svg.firstChild);
  if(defs.querySelector('#v5Arrow'))return;
  defs.insertAdjacentHTML('beforeend',`
    <filter id="v5Glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="v5Soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <marker id="v5Arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker>
    <linearGradient id="v5Heat" x1="0" x2="1"><stop stop-color="#d3eca6"/><stop offset=".55" stop-color="#f2c56d"/><stop offset="1" stop-color="#e36f52"/></linearGradient>
  `);
}
function group(svg){
  let g=svg.querySelector('#simulationPhysicsV5');
  if(!g){g=document.createElementNS(NS,'g');g.id='simulationPhysicsV5';g.setAttribute('aria-hidden','true');g.setAttribute('pointer-events','none');svg.appendChild(g);}
  return g;
}
function pill(x,y,text){return `<g class="v5-physics-label"><rect x="${x-5}" y="${y-13}" width="${Math.max(44,text.length*5.5+10)}" height="18" rx="8"/><text x="${x}" y="${y}">${text}</text></g>`;}
function dot(x,y,r=3,extra=''){return `<circle class="v5-particle ${extra}" cx="${x}" cy="${y}" r="${r}"/>`;}
function visual1(c){
  const phase=c.t*9,mid=471,y=222+(c.running?18*Math.sin(phase):0);
  return `<g class="v5-wave-guide"><line class="v5-guide" x1="235" y1="222" x2="707" y2="222"/><circle class="v5-node" cx="235" cy="222" r="6"/><circle class="v5-node" cx="707" cy="222" r="6"/><circle class="v5-antinode" cx="${mid}" cy="${y}" r="7"/><line class="v5-vector" x1="${mid}" y1="222" x2="${mid}" y2="${y}" marker-end="url(#v5Arrow)"/>${pill(448,193,'antinode')}${pill(242,201,'node')}</g>`;
}
function visual2(c){
  const pulse=.35+.25*Math.sin(c.t*5);
  return `<g class="v5-optics"><path class="v5-wavefront" d="M242 174 Q282 207 242 240 M272 166 Q320 207 272 248 M302 157 Q356 207 302 257"/><line class="v5-ray" x1="340" y1="207" x2="676" y2="139"/><line class="v5-ray main" x1="340" y1="207" x2="676" y2="207"/><line class="v5-ray" x1="340" y1="207" x2="676" y2="247"/><circle class="v5-optic-pulse" cx="${340+((c.t*130)%330)}" cy="207" r="4" opacity="${pulse}"/>${pill(430,129,'diffracted rays')}</g>`;
}
function visual3(c){
  const period=1.8,frac=((c.t%period)+period)%period/period,yy=c.running?105+Math.min(1,frac*1.25)**2*205:105;
  let trails='';if(c.running){for(let i=1;i<=4;i++){const py=Math.max(105,yy-i*22);trails+=`<circle class="v5-trail" cx="218" cy="${py}" r="${Math.max(3,10-i)}" opacity="${.34-i*.055}"/>`;}}
  return `<g class="v5-freefall"><line class="v5-gate-beam ${Math.abs(yy-158)<13?'active':''}" x1="181" y1="158" x2="255" y2="158"/><line class="v5-gate-beam ${Math.abs(yy-290)<13?'active':''}" x1="181" y1="290" x2="255" y2="290"/>${trails}<line class="v5-vector gravity" x1="284" y1="116" x2="284" y2="188" marker-end="url(#v5Arrow)"/>${pill(291,109,'g')}${pill(277,271,'timing gates')}</g>`;
}
function visual4(c){
  const F=n(c.vals[0]),ext=n(c.th.read?.Extension),move=clamp(ext*36,0,18),y=320+move;
  return `<g class="v5-young"><line class="v5-stress-wire" x1="500" y1="75" x2="500" y2="${y}"/><line class="v5-measure" x1="548" y1="320" x2="548" y2="${y}" marker-start="url(#v5Arrow)" marker-end="url(#v5Arrow)"/>${pill(558,Math.max(302,y-8),`ΔL ${ext.toFixed(2)}`)}<line class="v5-vector force" x1="500" y1="${y+10}" x2="500" y2="${y+52}" marker-end="url(#v5Arrow)"/>${pill(510,y+57,`F ${F.toFixed(1)} N`)}</g>`;
}
function visual5(c){
  const contactX=130+n(c.vals[0],.6)*645;
  let ds='';if(c.running){for(let i=0;i<7;i++){const span=Math.max(12,contactX-130),x=130+((c.t*105+i*span/7)%span);ds+=dot(x,291,3,'v5-charge');}}
  return `<g class="v5-resistivity"><line class="v5-active-length" x1="130" y1="291" x2="${contactX}" y2="291"/>${ds}<line class="v5-measure" x1="130" y1="311" x2="${contactX}" y2="311" marker-start="url(#v5Arrow)" marker-end="url(#v5Arrow)"/>${pill((130+contactX)/2,309,'selected L')}</g>`;
}
function visual6(c){
  const path='M390 304 C330 285 246 264 200 238 C248 310 330 322 390 304 C440 335 590 345 642 238 C580 246 520 250 478 214 C445 205 425 220 390 304';
  const terminal=c.th.read?.Terminal||'';
  return `<g class="v5-cell"><path class="v5-circuit-path ${c.running?'v5-flow':''}" d="${path}"/>${c.running?'<circle class="v5-current-dot" cx="510" cy="327" r="5"/>':''}${pill(442,251,`terminal p.d. ${terminal}`)}</g>`;
}
function visual7(c){
  if(currentMode===0){
    const ang=(c.running?Math.sin(c.t*3):0)*Math.min(12,n(c.vals[2],8)),rad=ang*Math.PI/180,L=190,x=350+Math.sin(rad)*L,y=92+Math.cos(rad)*L;
    return `<g class="v5-shm"><path class="v5-guide" d="M317 267 A190 190 0 0 0 383 267"/><line class="v5-equilibrium" x1="350" y1="94" x2="350" y2="301"/><line class="v5-measure" x1="350" y1="${y+28}" x2="${x}" y2="${y+28}" marker-end="url(#v5Arrow)"/>${pill(390,300,'equilibrium')}</g>`;
  }
  const dy=c.running?Math.sin(c.t*4)*34:0;
  return `<g class="v5-shm"><line class="v5-equilibrium" x1="300" y1="282" x2="454" y2="282"/><line class="v5-measure" x1="402" y1="282" x2="402" y2="${282+dy}" marker-end="url(#v5Arrow)"/>${pill(410,264,'equilibrium')}</g>`;
}
function visual8(c){
  if(currentMode===0){
    const load=n(c.vals[0]),move=clamp(load/1000*90,0,95),top=186+move,bottom=306,h=Math.max(12,bottom-top);
    let ps='';for(let i=0;i<18;i++){const x=302+((i*37+(c.running?c.t*18*(i%3-1):0))%68+68)%68;const y=top+8+((i*29+(c.running?c.t*27*(i%4-1.5):0))%(h-16)+(h-16))%(h-16);ps+=dot(x,y,2.4,'v5-gas-particle');}
    return `<g class="v5-gas">${ps}<line class="v5-vector pressure" x1="336" y1="${top-35}" x2="336" y2="${top-5}" marker-end="url(#v5Arrow)"/>${pill(348,top-40,'pressure')}</g>`;
  }
  const temp=n(c.vals[0]),len=120+temp*.8,bubbleY=320-len;
  return `<g class="v5-gas"><path class="v5-convection" d="M290 300 C270 260 278 225 304 211 M514 298 C534 260 526 225 500 211"/><line class="v5-measure" x1="420" y1="320" x2="420" y2="${bubbleY}" marker-end="url(#v5Arrow)"/>${pill(428,bubbleY-5,'gas length')}</g>`;
}
function visual9(c){
  const V=n(c.th.read?.Voltage),frac=clamp(V/Math.max(.001,n(c.vals[2],6)),0,1);
  let fields='';for(let y=165;y<=210;y+=15)fields+=`<line class="v5-cap-field" x1="561" y1="${y}" x2="581" y2="${y}" marker-end="url(#v5Arrow)" opacity="${.25+.65*frac}"/>`;
  return `<g class="v5-capacitor">${fields}<path class="v5-circuit-path ${c.running?'v5-flow':''}" d="M235 181 C320 145 390 182 476 182 C520 182 535 182 556 182"/>${pill(604,235,`charge ${Math.round(frac*100)}%`)}</g>`;
}
function visual10(c){
  let fs='';for(let x=594;x<=642;x+=16)fs+=`<line class="v5-field-line" x1="${x}" y1="214" x2="${x}" y2="254" marker-end="url(#v5Arrow)"/>`;
  const F=c.th.read?.Force||'';
  return `<g class="v5-magnetic">${fs}<circle class="v5-force-symbol" cx="706" cy="236" r="15"/><circle class="v5-force-dot" cx="706" cy="236" r="4"/>${pill(724,223,`F ${F}`)}</g>`;
}
function visual11(c){
  const rot=n(c.vals[0])+(c.running?Math.sin(c.t*2)*5:0),r=78,a=rot*Math.PI/180,x2=430+r*Math.sin(a),y2=215-r*Math.cos(a);
  let fs='';for(let y=175;y<=255;y+=20)fs+=`<line class="v5-field-line" x1="324" y1="${y}" x2="536" y2="${y}" marker-end="url(#v5Arrow)"/>`;
  return `<g class="v5-induction">${fs}<line class="v5-normal" x1="430" y1="215" x2="${x2}" y2="${y2}" marker-end="url(#v5Arrow)"/><path class="v5-angle" d="M430 180 A35 35 0 0 1 ${430+35*Math.sin(a)} ${215-35*Math.cos(a)}"/>${pill(447,172,'coil normal')}</g>`;
}
function visual12(c){
  const dist=Math.max(.05,n(c.vals[0],.3)),strength=clamp(.22/dist,.08,.72),pulse=c.running?((c.t*2.4)%1):0;
  const ringX=620-(275*pulse),ringR=7+17*pulse;
  return `<g class="v5-inverse-square"><path class="v5-intensity-cone" d="M620 195 L345 176 L345 238 L620 219 Z" opacity="${strength}"/><circle class="v5-count-wave" cx="${ringX}" cy="207" r="${ringR}" opacity="${c.running?.55:0}"/><line class="v5-measure" x1="345" y1="259" x2="620" y2="259" marker-start="url(#v5Arrow)" marker-end="url(#v5Arrow)"/>${pill(452,254,'intensity ∝ 1/r²')}</g>`;
}
const visuals={1:visual1,2:visual2,3:visual3,4:visual4,5:visual5,6:visual6,7:visual7,8:visual8,9:visual9,10:visual10,11:visual11,12:visual12};
function enhanceFrame(detail={}){
  try{if(typeof priorFrameHook==='function')priorFrameHook(detail);}catch(e){console.warn('Previous frame enhancement failed',e);}
  const scene=document.querySelector('#scene'),svg=scene?.querySelector('svg');
  if(!scene||!svg||typeof current==='undefined'||!current)return;
  ensureDefs(svg);const g=group(svg);
  const ctx={t:(typeof simT==='number'?simT:0)*(typeof speed==='number'?speed:1),running:typeof running!=='undefined'&&!!running,vals:safeVals(),th:safeTheory(),detail};
  const fn=visuals[current.id];g.innerHTML=fn?fn(ctx):'';
  scene.dataset.physicsLayer='v5';scene.classList.toggle('v5-running',ctx.running);
}
window.__sandboxEnhanceFrame=enhanceFrame;
window.__simulationVisualsV5={version:'5.0',refresh:enhanceFrame};
window.__simulationVisualsV5Ready=true;
try{enhanceFrame({initial:true});}catch{}
})();