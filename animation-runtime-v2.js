(()=>{
'use strict';
/*
  Practical Lab shared animation runtime v3.
  Keeps the public __animationRuntime API used by the smoke tests while
  coordinating all 12 practicals through one adaptive requestAnimationFrame loop.
*/
let engineRaf=0,engineLast=0,lastPaint=0,lastReadout=0,wasRunning=false;
let requestedPaint=true,requestedFullPaint=false,lastHtml='',avgRenderMs=0;
const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
const interactiveParts={
  1:['Mass hanger'],2:['Screen'],3:['Release mechanism'],4:['Test wire'],5:['Sliding contact'],
  6:['Switch','Variable resistor'],7:['Pendulum','Mass hanger'],8:['Gas syringe','Thermometer'],
  9:['Two-position switch','Resistor'],10:['Variable resistor'],11:['Search coil'],12:['Virtual source holder']
};
function installSandboxAsset(tag,attrs,key){
  if(document.querySelector(`[data-${key}]`))return;
  const el=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>el[k]=v);el.dataset[key]='1';document.head.appendChild(el);
}
function installSandboxTools(){
  installSandboxAsset('link',{rel:'stylesheet',href:'sandbox-tools-v3.css?v=20260917-sandbox-v3'},'sandboxToolsV3');
  if(!document.querySelector('script[data-feature26LiveScope]')){const s=document.createElement('script');s.src='feature-26-live-scope.js?v=20260917-sandbox-v3';s.async=false;s.dataset.feature26LiveScope='1';document.body.appendChild(s);}
}

function rendererForCurrent(){return current&&window['renderP'+current.id+'Scene'];}
function frameBudget(){
  if(reducedMotion())return 1000/24;
  if(avgRenderMs>19)return 1000/30;
  if(avgRenderMs>12)return 1000/45;
  return 1000/60;
}
function setRunUi(){
  const status=document.querySelector('#benchStatus');
  if(status){
    status.innerHTML=running?'<i class="status-lamp on"></i>RUNNING · LIVE MODEL':'<i class="status-lamp"></i>READY · CLICK RUN EXPERIMENT';
    status.classList.toggle('running',!!running);
  }
  const run=document.querySelector('#runBtn'),pause=document.querySelector('#pauseBtn');
  if(run){run.textContent=running?'▶ Running':'▶ Run experiment';run.setAttribute('aria-pressed',running?'true':'false');}
  if(pause)pause.disabled=!running;
}
function preserveToast(scene){
  const old=scene?.querySelector('.interaction-toast');
  return old&&old.classList.contains('show')?{text:old.textContent,show:true}:null;
}
function restoreToast(scene,saved){
  if(!scene||!saved)return;
  let node=scene.querySelector('.interaction-toast');
  if(!node){node=document.createElement('div');node.className='interaction-toast';scene.appendChild(node);}
  node.textContent=saved.text;node.classList.toggle('show',!!saved.show);
}
function refreshHandsOnAffordances(){
  const scene=document.querySelector('#scene');if(!scene||!current||scene.classList.contains('hands-off'))return;
  for(const part of interactiveParts[current.id]||[]){
    const el=scene.querySelector(`[data-part="${CSS.escape(part)}"]`);if(!el)continue;
    el.classList.add('direct-manip');el.setAttribute('role','button');el.setAttribute('tabindex','0');
    if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',`Interactive apparatus: ${part}`);
  }
}
function afterFrame(){
  try{window.applyInteractionGeometry?.();}catch(err){console.warn('Interaction geometry refresh failed',err);}
  refreshHandsOnAffordances();
  try{window.__sandboxEnhanceFrame?.({id:current?.id,mode:currentMode,time:simT,running:!!running});}catch(err){console.warn('Sandbox frame enhancement failed',err);}
}
function paintScene(force=false){
  if(!current)return;
  const scene=document.querySelector('#scene'),renderer=rendererForCurrent();
  if(!scene||typeof renderer!=='function')return;
  const started=performance.now();
  try{
    const html=renderer();
    if(force||html!==lastHtml){
      const toast=preserveToast(scene);
      scene.innerHTML=html;lastHtml=html;
      scene.dataset.animating=running?'1':'0';
      restoreToast(scene,toast);
      afterFrame();
    }else scene.dataset.animating=running?'1':'0';
    setRunUi();
    const now=performance.now();
    if(force||now-lastReadout>80){updateReadouts();lastReadout=now;}
    const cost=performance.now()-started;
    avgRenderMs=avgRenderMs?avgRenderMs*.88+cost*.12:cost;
    document.dispatchEvent(new CustomEvent('practicallab:frame',{detail:{id:current.id,mode:currentMode,time:simT,running:!!running,renderMs:cost}}));
  }catch(err){console.error('Animation frame failed',err);running=false;setRunUi();}
}
function fullPaint(){
  if(!current)return;
  try{renderScene();lastHtml=document.querySelector('#scene')?.innerHTML||'';afterFrame();}
  catch(err){console.error('Full scene render failed',err);paintScene(true);}
  setRunUi();
}
function requestPaint(full=false){requestedPaint=true;if(full)requestedFullPaint=true;}
function engineLoop(ts){
  if(!engineLast)engineLast=ts;
  const dt=Math.min(.05,Math.max(0,(ts-engineLast)/1000));engineLast=ts;
  if(running&&document.visibilityState!=='hidden')simT+=dt;
  const due=ts-lastPaint>=frameBudget();
  if(requestedFullPaint&&due){requestedFullPaint=false;requestedPaint=false;fullPaint();lastPaint=ts;}
  else if((running||requestedPaint)&&due){requestedPaint=false;paintScene(!lastHtml);lastPaint=ts;}
  if(wasRunning&&!running){fullPaint();lastPaint=ts;}
  wasRunning=!!running;
  engineRaf=requestAnimationFrame(engineLoop);
}
function ensureEngine(){
  if(engineRaf)return;
  engineLast=performance.now();lastPaint=0;lastReadout=0;wasRunning=!!running;requestedPaint=true;
  engineRaf=requestAnimationFrame(engineLoop);
}

startLoop=function(){if(raf){cancelAnimationFrame(raf);raf=0;}ensureEngine();requestPaint(true);};
function emitRunState(action){document.dispatchEvent(new CustomEvent('practicallab:runstate',{detail:{action,id:current?.id,mode:currentMode,time:simT,running:!!running}}));}
function runFromButton(){
  if(!current)return;const before=simT,was=running;
  try{runExperiment();}catch(err){console.error(err);running=true;}
  if(!running)running=true;
  if(!was&&simT===before&&[3,4,5,6,8,9,10,12].includes(current.id))simT=0;
  ensureEngine();requestPaint(true);setRunUi();emitRunState('run');
}
function pauseFromButton(){if(!current)return;try{pauseExperiment();}catch(err){running=false;}running=false;requestPaint(true);setRunUi();emitRunState('pause');}
function resetFromButton(){if(!current)return;try{resetExperiment();}catch(err){running=false;simT=0;methodStep=0;}running=false;simT=0;lastHtml='';requestPaint(true);setRunUi();emitRunState('reset');}
function bindControls(){
  const run=document.querySelector('#runBtn'),pause=document.querySelector('#pauseBtn'),reset=document.querySelector('#resetBtn');
  if(run)run.onclick=runFromButton;if(pause)pause.onclick=pauseFromButton;if(reset)reset.onclick=resetFromButton;
  const speedSel=document.querySelector('#speedSelect');if(speedSel)speedSel.onchange=e=>{speed=+e.target.value||1;requestPaint(true);};
  setRunUi();
}

const previousOpen=openPractical;
openPractical=function(id){lastHtml='';requestedPaint=true;requestedFullPaint=true;const out=previousOpen(id);bindControls();ensureEngine();requestPaint(true);return out;};
const previousModes=renderModeTabs;
renderModeTabs=function(){
  previousModes();
  document.querySelectorAll('[data-mode]').forEach(b=>{const old=b.onclick;b.onclick=e=>{running=false;simT=0;lastHtml='';if(old)old.call(b,e);bindControls();requestPaint(true);};});
};

document.addEventListener('visibilitychange',()=>{engineLast=performance.now();if(document.visibilityState==='visible')requestPaint(true);});
window.addEventListener('resize',()=>requestPaint(true),{passive:true});
window.addEventListener('load',()=>{bindControls();ensureEngine();requestPaint(true);},{once:true});

window.__animationRuntime={version:'3.0',running:()=>!!running,time:()=>simT,renderCost:()=>avgRenderMs,forceFrame:()=>paintScene(true),requestPaint:()=>requestPaint(false),requestFullPaint:()=>requestPaint(true),start:runFromButton,pause:pauseFromButton,reset:resetFromButton};
installSandboxTools();
})();
