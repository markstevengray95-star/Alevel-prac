(()=>{
'use strict';
const traces=new Map();
let activeKey='',selectedField='',frozen=false,lastSample=0;
const MAX_POINTS=120;
const keyFor=()=>current?`${current.id}_${currentMode}`:'';
const numericReadings=()=>{
  if(!current)return [];
  try{return Object.entries(theoretical().read||{}).map(([name,value])=>({name,value:String(value),number:Number.parseFloat(String(value).replace('−','-'))})).filter(x=>Number.isFinite(x.number));}
  catch{return [];}
};
function storeFor(key){if(!traces.has(key))traces.set(key,{});return traces.get(key);}
function seriesFor(key,field){const store=storeFor(key);if(!store[field])store[field]=[];return store[field];}
function panel(){return document.querySelector('#sandboxLiveScope');}
function ensurePanel(force=false){
  if(!current)return null;
  const readouts=document.querySelector('#readouts');if(!readouts)return null;
  const key=keyFor();let root=panel(),created=false;
  if(!root){
    root=document.createElement('section');root.id='sandboxLiveScope';root.className='sandbox-scope';created=true;root.innerHTML=`
      <div class="sandbox-scope-head">
        <div><span class="eyebrow">LIVE SENSOR TRACE</span><h3>Watch the measurement change</h3></div>
        <div class="sandbox-scope-controls"><label>Reading <select id="scopeField"></select></label><button class="secondary-btn" id="scopeFreeze">Freeze</button><button class="secondary-btn" id="scopeClear">Clear</button></div>
      </div>
      <div class="sandbox-scope-value"><strong id="scopeNow">—</strong><span id="scopeRange">Run the experiment to build a live trace.</span></div>
      <canvas id="scopeCanvas" width="900" height="180" aria-label="Live sensor trace"></canvas>`;
    readouts.insertAdjacentElement('afterend',root);
    root.querySelector('#scopeField').onchange=e=>{selectedField=e.target.value;draw();};
    root.querySelector('#scopeFreeze').onclick=()=>{frozen=!frozen;root.querySelector('#scopeFreeze').textContent=frozen?'Resume':'Freeze';root.classList.toggle('frozen',frozen);};
    root.querySelector('#scopeClear').onclick=()=>{const k=keyFor();if(k&&selectedField)seriesFor(k,selectedField).length=0;draw();};
  }
  if(created||force||key!==activeKey)refreshFields();
  return root;
}
function refreshFields(){
  const root=panel();if(!root||!current)return;
  const k=keyFor(),reads=numericReadings();
  if(k!==activeKey){activeKey=k;selectedField='';frozen=false;lastSample=0;root.classList.remove('frozen');root.querySelector('#scopeFreeze').textContent='Freeze';}
  const names=reads.map(x=>x.name);if(!names.length)return;
  if(!names.includes(selectedField))selectedField=names[0];
  const sel=root.querySelector('#scopeField');
  if(sel.dataset.options!==names.join('|')){sel.innerHTML=names.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');sel.dataset.options=names.join('|');}
  sel.value=selectedField;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function sample(detail){
  if(!current||frozen||!detail?.running)return;
  if(!panel())ensurePanel(true);
  const now=performance.now();if(now-lastSample<90)return;lastSample=now;
  if(keyFor()!==activeKey)refreshFields();
  const reading=numericReadings().find(x=>x.name===selectedField);if(!reading)return;
  const arr=seriesFor(keyFor(),selectedField);arr.push({t:detail.time,v:reading.number,label:reading.value});if(arr.length>MAX_POINTS)arr.splice(0,arr.length-MAX_POINTS);draw(reading);
}
function draw(latest){
  const root=panel();if(!root||!current)return;
  if(keyFor()!==activeKey)refreshFields();
  const arr=seriesFor(keyFor(),selectedField),canvas=root.querySelector('#scopeCanvas'),ctx=canvas.getContext('2d');
  const cssW=Math.max(320,canvas.clientWidth||900),cssH=Math.max(120,canvas.clientHeight||180),dpr=Math.min(2,window.devicePixelRatio||1);
  if(canvas.width!==Math.round(cssW*dpr)||canvas.height!==Math.round(cssH*dpr)){canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,cssH);
  const pad={l:46,r:14,t:14,b:26};ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--panel').trim()||'#ffffff';ctx.fillRect(0,0,cssW,cssH);
  ctx.strokeStyle='rgba(90,110,103,.20)';ctx.lineWidth=1;
  for(let i=0;i<5;i++){const y=pad.t+i*(cssH-pad.t-pad.b)/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(cssW-pad.r,y);ctx.stroke();}
  if(!arr.length){ctx.fillStyle='rgba(78,97,90,.75)';ctx.font='12px Inter, sans-serif';ctx.fillText('Run the simulation to see the selected sensor change over time.',pad.l,pad.t+24);root.querySelector('#scopeNow').textContent='—';root.querySelector('#scopeRange').textContent='No live samples yet.';return;}
  const vals=arr.map(p=>p.v),min0=Math.min(...vals),max0=Math.max(...vals),span=Math.max(Math.abs(max0-min0),Math.max(Math.abs(max0),1)*.02),min=min0-span*.12,max=max0+span*.12,t0=arr[0].t,t1=Math.max(t0+.1,arr[arr.length-1].t);
  const x=t=>pad.l+(t-t0)/(t1-t0)*(cssW-pad.l-pad.r),y=v=>pad.t+(max-v)/(max-min)*(cssH-pad.t-pad.b);
  ctx.strokeStyle='#467f6b';ctx.lineWidth=2.4;ctx.beginPath();arr.forEach((p,i)=>{const px=x(p.t),py=y(p.v);if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});ctx.stroke();
  const last=arr[arr.length-1];ctx.fillStyle='#234e40';ctx.beginPath();ctx.arc(x(last.t),y(last.v),4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(70,85,80,.8)';ctx.font='11px Inter, sans-serif';ctx.fillText(max0.toPrecision(4),4,pad.t+4);ctx.fillText(min0.toPrecision(4),4,cssH-pad.b);ctx.fillText(`${(t1-t0).toFixed(1)} s`,cssW-52,cssH-7);
  const read=latest||numericReadings().find(x=>x.name===selectedField);root.querySelector('#scopeNow').textContent=read?.value||last.label||String(last.v);root.querySelector('#scopeRange').textContent=`${selectedField}: ${min0.toPrecision(4)} to ${max0.toPrecision(4)} across ${arr.length} live samples${frozen?' · frozen':''}`;
}
document.addEventListener('practicallab:frame',e=>sample(e.detail));
document.addEventListener('practicallab:runstate',()=>{if(current){ensurePanel(true);draw();}});
window.addEventListener('resize',()=>draw(),{passive:true});
setInterval(()=>{if(current){ensurePanel();if(!running)draw();}},700);
window.__liveScopeReady=true;
})();
