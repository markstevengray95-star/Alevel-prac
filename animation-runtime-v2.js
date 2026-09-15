(()=>{
'use strict';
let engineRaf=0,engineLast=0,lastPaint=0,lastReadout=0,wasRunning=false;
const FRAME_MS=1000/30;

function rendererForCurrent(){return current&&window['renderP'+current.id+'Scene];}
function setRunUi(){
  const status=document.querySelector('#benchStatus');
  if(status){status.innerHTML=running?'<i class="status-lamp on"></i>RUNNING · LIVE MODEL':'<i class="status-lamp"></i>READY · CLICK RUN EXPERIMENT';status.classList.toggle('running',!!running);}
  const run=document.querySelector('#runBtn'),pause=document.querySelector('#pauseBtn');
  if(run){run.textContent=running?'▶ Running':'▶ Run experiment';run.setAttribute('aria-pressed',running?'true':'false');}
  if(pause)pause.disabled=!running;
}
function fastPaint(force=false){
  if(!current)return;
  const scene=document.querySelector('#scene'),renderer=rendererForCurrent();
  if(!scene||typeof renderer!=='function')return;
  try{
    scene.innerHTML=renderer();
    scene.dataset.animating=running?'1':'0';
    setRunUi();
    const now=performance.now();
    if(force||now-lastReadout>90){updateReadouts();lastReadout=now;}
  }catch(err){
    console.error('Animation frame failed',err);
    running=false;setRunUi();
  }
}
function fullPaint(){
  if(!current)return;
  try{renderScene();}catch(err){console.error('Full scene render failed',err);fastPaint(true);}
  setRunUi();
}
function engineLoop(ts){
  if(!engineLast)engineLast=ts;
  const dt=Math.min(.05,Math.max(0,(ts-engineLast)/1000));
  engineLast=ts;
  if(running&&document.visibilityState!=='hidden'){
    simT+=dt;
    if(ts-lastPaint>=FRAME_MS){fastPaint();lastPaint=ts;}
  }
  if(wasRunning&&!running)fullPaint();
  wasRunning=!!running;
  engineRaf=requestAnimationFrame(engineLoop);
}
function ensureEngine(){
  if(engineRaf)return;
  engineLast=performance.now();lastPaint=0;lastReadout=0;wasRunning=!!running;
  engineRaf=requestAnimationFrame(engineLoop);
}

// Replace the older scene-rebuild loop with a single persistent scheduler.
startLoop=function(){
  if(raf){cancelAnimationFrame(raf);raf=0;}
  ensureEngine();
};

function runFromButton(){
  if(!current)return;
  const before=simT;
  try{runExperiment();}catch(err){console.error(err);running=true;}
  // Experiments that depend on an obvious start transient should begin at t=0.
  if([3,4,8,9,10,12].includes(current.id)&&(!running||simT===before))simT=0;
  running=true;
  ensureEngine();
  fastPaint(true);
}
function pauseFromButton(){
  if(!current)return;
  try{pauseExperiment();}catch(err){running=false;}
  running=false;fullPaint();
}
function resetFromButton(){
  if(!current)return;
  try{resetExperiment();}catch(err){running=false;simT=0;methodStep=0;}
  running=false;simT=0;fullPaint();
}
function bindControls(){
  const run=document.querySelector('#runBtn'),pause=document.querySelector('#pauseBtn'),reset=document.querySelector('#resetBtn');
  if(run)run.onclick=runFromButton;
  if(pause)pause.onclick=pauseFromButton;
  if(reset)reset.onclick=resetFromButton;
  const speedSel=document.querySelector('#speedSelect');if(speedSel)speedSel.onchange=e=>{speed=+e.target.value||1;};
  setRunUi();
}

// Keep the engine alive when a practical/mode is opened and ensure controls use the current handlers.
const previousOpen=openPractical;
openPractical=function(id){
  const out=previousOpen(id);bindControls();ensureEngine();fullPaint();return out;
};
const previousModes=renderModeTabs;
renderModeTabs=function(){
  previousModes();
  document.querySelectorAll('[data-mode]').forEach(b=>{
    const old=b.onclick;
    b.onclick=e=>{running=false;simT=0;if(old)old.call(b,e);bindControls();fullPaint();};
  });
};

document.addEventListener('visibilitychange',()=>{engineLast=performance.now();});
window.addEventListener('load',()=>{bindControls();ensureEngine();},{once:true});

// Debug hooks used by the browser validation suite.
window.__animationRuntime={
  running:()=>!!running,
  time:()=>simT,
  forceFrame:()=>fastPaint(true),
  start:runFromButton,
  pause:pauseFromButton,
  reset:resetFromButton
};
})();