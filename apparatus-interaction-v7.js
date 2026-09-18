(()=>{
'use strict';
if(window.__apparatusInteractionV7Ready)return;
const NS='http://www.w3.org/2000/svg';
const priorFrameHook=window.__sandboxEnhanceFrame;
const baseTheoretical=theoretical;
const baseRecord=record;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,f=0)=>{const m=String(v??'').replace('−','-').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);return m?+m[0]:f;};
const sessions=new Map();
let drag=null;

const leadCfg={
  5:{from:'Voltmeter',correct:'Resistance wire',wrong:'Ammeter',label:'Voltmeter lead'},
  6:{from:'Voltmeter',correct:'Cell',wrong:'Ammeter',label:'Voltmeter lead'},
  9:{from:'Voltmeter',correct:'Capacitor',wrong:'Resistor',label:'Capacitor p.d. lead'},
  11:{from:'Oscilloscope',correct:'Search coil',wrong:'Large circular coil',label:'Oscilloscope lead'}
};
function key(){return current?current.id+':'+currentMode:'0:0';}
function defaults(){
  return{releaseX:0,level:0,fiducialX:0,balanceZero:0,coilX:0,lead:'correct'};
}
function st(){const k=key();if(!sessions.has(k))sessions.set(k,defaults());return sessions.get(k);}
function reset(){sessions.set(key(),defaults());drag=null;requestPaint();toast('Apparatus reset to the reference setup');}
function requestPaint(){try{window.__animationRuntime?.requestFullPaint?.();}catch{}}
function toast(msg){
  const scene=document.querySelector('#scene');if(!scene)return;
  let n=scene.querySelector('.interaction-toast');if(!n){n=document.createElement('div');n.className='interaction-toast';scene.appendChild(n);}
  n.textContent=msg;n.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>n?.classList.remove('show'),1400);
}
function status(){
  const s=st(),id=current?.id||0;
  if(id===3&&Math.abs(s.releaseX)>22)return{ok:false,kind:'invalid',text:'Release misses gate line'};
  if(id===4&&Math.abs(s.level)>.18)return{ok:true,kind:'bias',text:'Spirit level off-centre'};
  if(id===5||id===6||id===9||id===11){
    if(s.lead==='open')return{ok:false,kind:'invalid',text:'Measurement lead open'};
    if(s.lead==='wrong')return{ok:false,kind:'invalid',text:'Lead on wrong terminal'};
  }
  if(id===7&&Math.abs(s.fiducialX)>14)return{ok:true,kind:'bias',text:'Fiducial away from equilibrium'};
  if(id===10&&Math.abs(s.balanceZero)>.004)return{ok:true,kind:'bias',text:'Balance not tared'};
  if(id===11&&Math.abs(s.coilX)>12)return{ok:true,kind:'bias',text:'Search coil off-centre'};
  return{ok:true,kind:'ready',text:'Setup ready'};
}
function modified(){
  const s=st();return Math.abs(s.releaseX)>.01||Math.abs(s.level)>.001||Math.abs(s.fiducialX)>.01||
    Math.abs(s.balanceZero)>.0001||Math.abs(s.coilX)>.01||s.lead!=='correct';
}
function applyMeasurement(out){
  if(!current||!out)return out;
  const s=st(),r={...(out.read||{})};out={...out,read:r};
  if(current.id===3&&Math.abs(s.releaseX)>22){
    r.Time='NO GATE';r['2h/t']='—';out.__v7Invalid=true;
  }
  if(current.id===4&&Math.abs(s.level)>.001){
    const vals=getVals(),L=vals[1],baseMm=num(r.Extension),biasMm=s.level*.08,mm=Math.max(0,baseMm+biasMm);
    r.Extension=mm.toFixed(3)+' mm';
    const strain=mm/1000/L;out.y=strain;r.Strain=strain.toExponential(3);out.__v7Biased=true;
  }
  if(current.id===5&&s.lead!=='correct'){
    if(s.lead==='wrong'){r.Voltage='0.00 V';r.Resistance='0.000 Ω';out.y=0;}
    else{r.Voltage='—';r.Resistance='—';}
    out.__v7Invalid=true;
  }
  if(current.id===6&&s.lead!=='correct'){
    if(s.lead==='wrong'){r.Terminal='0.000 V';out.y=0;}
    else r.Terminal='—';
    out.__v7Invalid=true;
  }
  if(current.id===7&&Math.abs(s.fiducialX)>.01){
    const frac=Math.abs(s.fiducialX)/36,bias=1+frac*.018;
    if(currentMode===0){const T=num(r.Period)*bias;r.Period=T.toFixed(3)+' s';r.Total=(T*num(r.Cycles,10)).toFixed(2)+' s';out.y=T*T;}
    else{const T=num(r.Period)*bias;r.Period=T.toFixed(3)+' s';out.y=T*T;}
    out.__v7Biased=true;
  }
  if(current.id===9&&s.lead!=='correct'){
    const vals=getVals(),V0=vals[2],vc=num(r.Voltage);
    if(s.lead==='wrong'){const vr=Math.max(0,V0-vc);r.Voltage=vr.toFixed(2)+' V';const signal=Math.max(vr,1e-9);out.y=Math.log(signal);r['ln term']=out.y.toFixed(3);}
    else{r.Voltage='—';r['ln term']='—';}
    out.__v7Invalid=true;
  }
  if(current.id===10&&Math.abs(s.balanceZero)>.00001){
    const baseg=num(r.Balance),shown=baseg+s.balanceZero;
    r.Balance=shown.toFixed(3)+' g';out.y=shown*9.81; // mN numerically from grams
    r.Force=out.y.toFixed(2)+' mN';out.__v7Biased=true;
  }
  if(current.id===11){
    let emf=num(r.EMF),factor=clamp(1-Math.abs(s.coilX)/260,.65,1);
    if(s.lead==='wrong'){emf=getVals()[1];out.__v7Invalid=true;}
    else if(s.lead==='open'){emf=0;out.__v7Invalid=true;}
    else if(Math.abs(s.coilX)>.01)out.__v7Biased=true;
    emf*=factor;r.EMF=emf.toFixed(3)+' V';out.y=emf;
  }
  return out;
}
theoretical=function(vals=getVals()){return applyMeasurement(baseTheoretical(vals));};

record=function(repeats=1){
  const th=theoretical();
  if(th?.__v7Invalid){toast('Reading not recorded — correct the apparatus setup first');return false;}
  return baseRecord(repeats);
};

function bbox(el){try{return el?.getBBox?.()||null;}catch{return null;}}
function centre(el){const b=bbox(el);return b?{x:b.x+b.width/2,y:b.y+b.height/2}:null;}
function sceneSvg(){return document.querySelector('#scene svg');}
function svgPoint(e){
  const svg=sceneSvg();if(!svg)return null;const r=svg.getBoundingClientRect();
  return{x:(e.clientX-r.left)/r.width*900,y:(e.clientY-r.top)/r.height*430};
}
function ensureLayer(svg){
  let g=svg.querySelector('#apparatusInteractionV7');
  if(!g){g=document.createElementNS(NS,'g');g.id='apparatusInteractionV7';svg.appendChild(g);}
  return g;
}
function applyGeometry(svg){
  const s=st(),id=current?.id;
  if(id===3){
    const release=svg.querySelector('[data-part="Release mechanism"]'),ball=svg.querySelector('[data-part="Ball bearing"]');
    if(release)release.setAttribute('transform',`translate(${s.releaseX} 0)`);
    if(ball)ball.setAttribute('transform',`translate(${s.releaseX} 0)`);
    const v5=svg.querySelector('.v5-freefall');if(v5)v5.setAttribute('transform',`translate(${s.releaseX} 0)`);
  }
  if(id===7){
    const f=svg.querySelector('[data-part="Fiducial marker"]');if(f)f.setAttribute('transform',`translate(${s.fiducialX} 0)`);
  }
  if(id===11){
    const coil=svg.querySelector('[data-part="Search coil"]');
    if(coil){const ang=getVals()[0];coil.setAttribute('transform',`translate(${s.coilX} 0) rotate(${ang} 430 215)`);}
    const v5=svg.querySelector('.v5-induction');if(v5)v5.setAttribute('transform',`translate(${s.coilX} 0)`);
  }
}
function socketFor(name){const el=sceneSvg()?.querySelector(`[data-part="${CSS.escape(name)}"]`);return centre(el);}
function leadHtml(){
  const cfg=leadCfg[current?.id],s=st();if(!cfg)return'';
  const from=socketFor(cfg.from),good=socketFor(cfg.correct),bad=socketFor(cfg.wrong);if(!from||!good||!bad)return'';
  let to=s.lead==='wrong'?bad:s.lead==='open'?(drag?.point||{x:(good.x+bad.x)/2,y:Math.min(good.y,bad.y)-65}):good;
  if(drag?.type==='lead'&&drag.id===current.id)to=drag.point;
  const mx=(from.x+to.x)/2,path=`M${from.x} ${from.y} C${mx} ${from.y+28} ${mx} ${to.y-28} ${to.x} ${to.y}`;
  const showLabels=drag?.type==='lead';
  return `<g class="v7-lead">
    <path class="v7-lead-shadow" d="${path}"/><path class="v7-lead-wire ${s.lead}" d="${path}"/>
    <circle class="v7-socket good" cx="${good.x}" cy="${good.y}" r="10"/><circle class="v7-socket bad" cx="${bad.x}" cy="${bad.y}" r="10"/>
    <circle class="v7-plug" data-v7-control="lead" cx="${to.x}" cy="${to.y}" r="11"/>
    ${showLabels?`<text class="v7-target-label good" x="${good.x+12}" y="${good.y-11}">correct</text><text class="v7-target-label bad" x="${bad.x+12}" y="${bad.y-11}">wrong</text>`:''}
  </g>`;
}
function controlsHtml(){
  const s=st(),id=current?.id;let h='';
  if(id===3)h+=`<g class="v7-control"><line class="v7-align-axis" x1="218" y1="112" x2="218" y2="314"/><circle class="v7-handle" data-v7-control="release" cx="${218+s.releaseX}" cy="83" r="10"/><text x="${230+s.releaseX}" y="86">align release</text></g>`;
  if(id===4)h+=`<g class="v7-control"><rect class="v7-level-track" x="392" y="207" width="56" height="16" rx="8"/><circle class="v7-bubble" data-v7-control="level" cx="${420+s.level*24}" cy="215" r="7"/><text x="392" y="199">centre bubble</text></g>`;
  if(id===7)h+=`<g class="v7-control"><line class="v7-align-axis" x1="350" y1="238" x2="350" y2="330"/><circle class="v7-handle" data-v7-control="fiducial" cx="${350+s.fiducialX}" cy="326" r="9"/><text x="${362+s.fiducialX}" y="329">fiducial</text></g>`;
  if(id===10)h+=`<g class="v7-control"><rect class="v7-zero-track" x="681" y="328" width="15" height="48" rx="7"/><circle class="v7-handle" data-v7-control="balance" cx="688.5" cy="${352-s.balanceZero*220}" r="8"/><text x="701" y="346">zero</text><text class="v7-tare" data-v7-control="tare" x="700" y="362">TARE</text></g>`;
  if(id===11)h+=`<g class="v7-control"><line class="v7-align-axis" x1="365" y1="215" x2="495" y2="215"/><circle class="v7-handle" data-v7-control="coil" cx="${430+s.coilX}" cy="215" r="9"/><text x="${442+s.coilX}" y="207">centre coil</text></g>`;
  return h+leadHtml();
}
function statusHtml(){
  const q=status(),mod=modified(),x=662,y=390;
  return `<g class="v7-status ${q.kind}"><rect x="${x}" y="${y}" width="${mod?214:150}" height="28" rx="12"/><circle cx="${x+15}" cy="${y+14}" r="5"/><text x="${x+27}" y="${y+18}">${q.text}</text>${mod?`<text class="v7-reset" data-v7-reset="1" x="${x+165}" y="${y+18}">RESET</text>`:''}</g>`;
}
function renderV7(detail={}){
  try{if(typeof priorFrameHook==='function')priorFrameHook(detail);}catch(e){console.warn('v6 frame hook failed',e);}
  const scene=document.querySelector('#scene'),svg=scene?.querySelector('svg');if(!scene||!svg||!current)return;
  applyGeometry(svg);
  const layer=ensureLayer(svg);layer.innerHTML=controlsHtml()+statusHtml();
  const q=status();scene.dataset.apparatusLayer='v7';scene.classList.toggle('v7-invalid',q.kind==='invalid');scene.classList.toggle('v7-biased',q.kind==='bias');
}
function startDrag(e,type){
  const p=svgPoint(e);if(!p)return;e.preventDefault();e.stopPropagation();drag={type,id:current.id,mode:currentMode,point:p};document.body.classList.add('lab-dragging');
}
function pointerDown(e){
  const c=e.target.closest?.('[data-v7-control]');if(c){
    const type=c.dataset.v7Control;
    if(type==='tare'){st().balanceZero=0;toast('Balance tared to zero');requestPaint();return;}
    startDrag(e,type);return;
  }
  if(e.target.closest?.('[data-v7-reset]')){e.preventDefault();e.stopPropagation();reset();}
}
function pointerMove(e){
  if(!drag||!current||drag.id!==current.id||drag.mode!==currentMode)return;
  const p=svgPoint(e);if(!p)return;drag.point=p;const s=st();
  if(drag.type==='release')s.releaseX=clamp(p.x-218,-55,55);
  if(drag.type==='level')s.level=clamp((p.x-420)/24,-1,1);
  if(drag.type==='fiducial')s.fiducialX=clamp(p.x-350,-38,38);
  if(drag.type==='balance')s.balanceZero=clamp((352-p.y)/220,-.08,.08);
  if(drag.type==='coil')s.coilX=clamp(p.x-430,-70,70);
  renderV7({drag:true});
}
function pointerUp(){
  if(!drag)return;const s=st(),type=drag.type;
  if(type==='lead'){
    const cfg=leadCfg[current.id],p=drag.point,good=socketFor(cfg.correct),bad=socketFor(cfg.wrong);
    const dg=good?Math.hypot(p.x-good.x,p.y-good.y):999,db=bad?Math.hypot(p.x-bad.x,p.y-bad.y):999;
    s.lead=dg<34?'correct':db<34?'wrong':'open';
    toast(s.lead==='correct'?'Lead snapped to the correct terminal':s.lead==='wrong'?'Lead connected to the wrong terminal':'Lead left open — meter circuit incomplete');
  }else{
    const q=status();toast(q.kind==='ready'?'Setup aligned':q.text);
  }
  drag=null;document.body.classList.remove('lab-dragging');requestPaint();
}
function bind(){
  const scene=document.querySelector('#scene');if(!scene||scene.dataset.v7Bound)return;
  scene.dataset.v7Bound='1';scene.addEventListener('pointerdown',pointerDown);
}
window.addEventListener('pointermove',pointerMove,{passive:true});
window.addEventListener('pointerup',pointerUp);window.addEventListener('pointercancel',pointerUp);
const oldOpen=openPractical;
openPractical=function(id){drag=null;const out=oldOpen(id);setTimeout(()=>{bind();renderV7({open:true});},0);return out;};
window.__sandboxEnhanceFrame=function(detail={}){bind();renderV7(detail);};
window.__apparatusInteractionV7={
  version:'7.0',ready:()=>true,state:()=>({...st()}),reset,
  set:(patch)=>{Object.assign(st(),patch||{});requestPaint();},
  status,refresh:renderV7
};
window.__apparatusInteractionV7Ready=true;
setTimeout(()=>{bind();renderV7({initial:true});},0);
})();