(()=>{
'use strict';
if(window.__freeBuildBenchV8Ready)return;
const api=()=>window.__freeBuildBenchV8;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let observer=null,enhancing=false,selectedPort=null,wireDrag=null;
const CAT={power:/power|supply|cell|battery|generator|source/i,meter:/ammeter|voltmeter|timer|logger|oscilloscope|micrometer|vernier|thermometer|scale|ruler|metre|protractor|balance/i,support:/support|clamp|holder|pulley|stand|screen|bath/i};
function cat(name){if(CAT.power.test(name))return'power';if(CAT.meter.test(name))return'meter';if(CAT.support.test(name))return'support';return'apparatus';}
function icon(name){const c=cat(name);return c==='power'?'PWR':c==='meter'?'MEAS':c==='support'?'RIG':'APP';}
function degree(id){return Math.max(1,api().edges().filter(x=>x[0]===id||x[1]===id).length);}
function reqKeys(){return new Set(api().edges().map(x=>[x[0],x[1]].sort().join('|')));}
function nodeHtml(id){
  const s=api().session(),p=api().pos(id),name=api().name(id),sel=s.selected===id;
  let ports='';for(let i=0;i<degree(id);i++)ports+='<button class="fb-port" data-fb-port="'+esc(id)+'" data-port-index="'+i+'" aria-label="Connection port '+(i+1)+' on '+esc(name)+'"></button>';
  return '<article class="fb-node '+(sel?'selected':'')+'" data-fb-node="'+esc(id)+'" style="left:'+p.x+'%;top:'+p.y+'%">'+
    '<button class="fb-node-drag" data-fb-node-drag="'+esc(id)+'" aria-label="Move '+esc(name)+'"><span class="fb-type '+cat(name)+'">'+icon(name)+'</span><b>'+esc(name)+'</b></button>'+
    '<div class="fb-ports">'+ports+'</div><button class="fb-inspect" data-fb-select="'+esc(id)+'" aria-label="Inspect '+esc(name)+'">i</button></article>';
}
function trayHtml(){
  const s=api().session(),available=api().items().filter(x=>!s.placed.includes(x[0]));
  if(!available.length)return'<p class="fb-empty-tray">All required apparatus has been placed.</p>';
  return available.map(x=>'<button class="fb-tray-item" draggable="true" data-fb-tray="'+esc(x[0])+'"><span class="fb-type '+cat(x[1])+'">'+icon(x[1])+'</span><b>'+esc(x[1])+'</b><small>Drag to bench</small></button>').join('');
}
function wirePath(a,b){
  const A=api().pos(a),B=api().pos(b),m=(A.x+B.x)/2;
  return'M'+A.x+' '+A.y+' C'+m+' '+A.y+' '+m+' '+B.y+' '+B.x+' '+B.y;
}
function wiresHtml(){
  const s=api().session(),req=reqKeys();
  return s.links.map(k=>{
    const p=k.split('|'),a=p[0],b=p[1];if(!s.placed.includes(a)||!s.placed.includes(b))return'';
    return'<path class="fb-wire '+(req.has(k)?'correct':'wrong')+'" d="'+wirePath(a,b)+'" data-fb-wire="'+esc(k)+'"></path>';
  }).join('');
}
function inspectorHtml(){
  const s=api().session(),id=s.selected;if(!id)return'<div class="fb-inspector-empty"><b>Select apparatus</b><p>Drag apparatus by its body. Connect components by dragging from one port to another.</p></div>';
  const name=api().name(id),cals=(api().cfg()?.cal||[]).map((text,i)=>({text,i,targets:api().calTargets(i)})).filter(x=>x.targets.includes(id));
  const links=s.links.filter(k=>k.split('|').includes(id));
  let h='<div class="fb-inspector-head"><span class="fb-type '+cat(name)+'">'+icon(name)+'</span><div><small>SELECTED</small><b>'+esc(name)+'</b></div></div>';
  if(cals.length){h+='<div class="fb-inspector-section"><h5>Calibration</h5>';for(const c of cals)h+='<button data-fb-calibrate="'+c.i+'" class="'+(s.cal[c.i]?'done':'')+'"><span>'+(s.cal[c.i]?'✓':'○')+'</span>'+esc(c.text)+'</button>';h+='</div>';}
  h+='<div class="fb-inspector-section"><h5>Connections</h5>';
  h+=links.length?links.map(k=>'<button data-fb-disconnect="'+esc(k)+'">Disconnect '+esc(k.split('|').map(api().name).join(' ↔ '))+'</button>').join(''):'<p>No connections yet.</p>';
  h+='</div><button class="fb-remove" data-fb-remove="'+esc(id)+'">Remove from bench</button>';return h;
}
function checklistHtml(v){
  const c=api().cfg(),totalItems=api().items().length,totalLinks=reqKeys().size,totalCal=c?.cal?.length||0,totalGeo=v.geo.length;
  let h='<div class="fb-score"><strong>'+v.score+'%</strong><span>'+(v.ready?'READY TO MEASURE':'BUILD IN PROGRESS')+'</span></div>';
  h+='<div class="fb-metrics"><span><b>'+(totalItems-v.missing.length)+'/'+totalItems+'</b> apparatus</span><span><b>'+(totalLinks-v.missLinks.length)+'/'+totalLinks+'</b> required links</span><span><b>'+(totalCal-v.calMissing.length)+'/'+totalCal+'</b> calibrated</span><span><b>'+(totalGeo-v.geoBad.length)+'/'+totalGeo+'</b> geometry</span></div><div class="fb-rule-list">';
  for(const id of v.missing)h+='<p class="bad">Place '+esc(api().name(id))+'</p>';
  for(const k of v.missLinks)h+='<p class="bad">Connect '+esc(k.split('|').map(api().name).join(' ↔ '))+'</p>';
  for(const k of v.wrongLinks)h+='<p class="bad">Remove incorrect link: '+esc(k.split('|').map(api().name).join(' ↔ '))+'</p>';
  for(const i of v.calMissing)h+='<p class="warn">Calibrate: '+esc(c.cal[i])+'</p>';
  for(const g of v.geo)h+='<p class="'+(g.ok?'good':'warn')+'">'+(g.ok?'✓':'○')+' '+esc(g.name)+'</p>';
  if(v.ready)h+='<p class="good"><b>All build rules pass. Live measurement unlocked.</b></p>';return h+'</div>';
}
function freeBuildHtml(){
  const s=api().session(),v=api().validate();
  return'<div class="free-build-v8" id="freeBuildV8"><div class="fb-topline"><div><span>FREE-BUILD BENCH v8</span><h3>Construct the practical from an empty bench</h3><p>Drag apparatus into position, wire the correct components and calibrate the measuring equipment. The live experiment unlocks only when the physical setup validates.</p></div><div class="fb-top-actions"><button data-fb-reference>Show reference build</button><button data-fb-reset>Empty bench</button></div></div>'+
  '<div class="fb-layout"><aside class="fb-tray"><h4>Apparatus tray</h4><div class="fb-tray-list">'+trayHtml()+'</div></aside>'+
  '<section class="fb-bench" id="freeBuildBench" tabindex="0"><div class="fb-bench-grid"></div><svg class="fb-wire-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+wiresHtml()+'</svg>'+
  s.placed.map(nodeHtml).join('')+(!s.placed.length?'<div class="fb-bench-empty"><b>Empty laboratory bench</b><span>Drag the first item from the tray to begin.</span></div>':'')+'</section>'+
  '<aside class="fb-side"><div class="fb-inspector">'+inspectorHtml()+'</div><div class="fb-validation">'+checklistHtml(v)+'</div></aside></div></div>';
}
function gate(){
  if(!current)return;const active=api().isActive(),v=active?api().validate():{ready:true};
  const run=document.querySelector('#runBtn'),record=document.querySelector('#recordBtn'),reps=document.querySelector('#repeatsBtn'),scene=document.querySelector('#scene'),wb=document.querySelector('.workbench');
  for(const b of [run,record,reps])if(b){b.disabled=active&&!v.ready;b.dataset.fbLocked=active&&!v.ready?'1':'0';}
  if(run)run.title=active&&!v.ready?'Complete the free-build apparatus before running the experiment.':'';
  if(record)record.title=active&&!v.ready?'Complete the free-build apparatus before recording data.':'';
  if(wb){wb.classList.toggle('free-build-active',active);wb.classList.toggle('free-build-locked',active&&!v.ready);}
  if(scene)scene.dataset.freeBuild=active?(v.ready?'ready':'locked'):'off';
  let lock=wb?.querySelector('#freeBuildSceneLock');
  if(active&&!v.ready&&wb&&!lock){lock=document.createElement('div');lock.id='freeBuildSceneLock';lock.className='fb-scene-lock';lock.innerHTML='<b>Live apparatus locked</b><span>Complete the Free-build bench below to reveal and run the simulation.</span>';scene?.after(lock);}
  if((!active||v.ready)&&lock)lock.remove();
}
function drawWires(root){
  const layer=root.querySelector('.fb-wire-layer');if(!layer)return;layer.innerHTML=wiresHtml();
}
function bind(root){
  const bench=root.querySelector('#freeBuildBench');if(!bench)return;
  root.querySelector('[data-fb-reset]')?.addEventListener('click',()=>api().reset());
  root.querySelector('[data-fb-reference]')?.addEventListener('click',()=>api().reference());
  root.querySelectorAll('[data-fb-tray]').forEach(el=>{
    el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.fbTray);e.dataTransfer.effectAllowed='copy';});
    el.addEventListener('dblclick',()=>api().place(el.dataset.fbTray,45,45));
    el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();api().place(el.dataset.fbTray,45,45);}});
  });
  bench.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';bench.classList.add('drag-over');});
  bench.addEventListener('dragleave',()=>bench.classList.remove('drag-over'));
  bench.addEventListener('drop',e=>{e.preventDefault();bench.classList.remove('drag-over');const id=e.dataTransfer.getData('text/plain'),r=bench.getBoundingClientRect();api().place(id,(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);});
  root.querySelectorAll('[data-fb-node-drag]').forEach(el=>{
    el.onpointerdown=e=>{if(e.target.closest('.fb-port,.fb-inspect'))return;e.preventDefault();const id=el.dataset.fbNodeDrag,node=el.closest('.fb-node');
      const move=ev=>{const r=bench.getBoundingClientRect();api().session().positions[id]={x:Math.max(4,Math.min(92,(ev.clientX-r.left)/r.width*100)),y:Math.max(6,Math.min(88,(ev.clientY-r.top)/r.height*100))};const p=api().pos(id);if(node){node.style.left=p.x+'%';node.style.top=p.y+'%';}drawWires(root);};
      const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);api().setPosition(id,api().pos(id).x,api().pos(id).y);};
      window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});};
  });
  root.querySelectorAll('[data-fb-select]').forEach(b=>b.onclick=e=>{e.stopPropagation();api().select(b.dataset.fbSelect);});
  root.querySelectorAll('[data-fb-remove]').forEach(b=>b.onclick=()=>api().remove(b.dataset.fbRemove));
  root.querySelectorAll('[data-fb-calibrate]').forEach(b=>b.onclick=()=>api().calibrate(+b.dataset.fbCalibrate,!api().session().cal[+b.dataset.fbCalibrate]));
  root.querySelectorAll('[data-fb-disconnect]').forEach(b=>b.onclick=()=>api().disconnect(b.dataset.fbDisconnect));
  root.querySelectorAll('[data-fb-port]').forEach(p=>{
    p.onpointerdown=e=>{e.preventDefault();e.stopPropagation();wireDrag={from:p.dataset.fbPort,previous:selectedPort};document.body.classList.add('fb-wiring');};
    p.onclick=e=>{e.preventDefault();e.stopPropagation();};
  });
}
function enhance(){
  if(enhancing||!current||!api()?.cfg())return;enhancing=true;
  try{
    const root=document.querySelector('#experimentalSandboxV4');if(!root)return;const toolbar=root.querySelector('.sb-toolbar');if(!toolbar)return;
    let free=toolbar.querySelector('[data-sb-mode="freebuild"]');if(!free){free=document.createElement('button');free.dataset.sbMode='freebuild';free.textContent='Free build';toolbar.insertBefore(free,toolbar.querySelector('.sb-spacer'));free.onclick=()=>api().setMode();}
    free.classList.toggle('active',api().isActive());
    const grid=root.querySelector('.sb-grid');if(api().isActive()&&grid){const sig=current.id+':'+currentMode+':'+JSON.stringify(api().session());grid.classList.add('fb-host');if(grid.dataset.fbSig!==sig){grid.dataset.fbSig=sig;grid.innerHTML=freeBuildHtml();bind(root);}root.open=true;}
    gate();
  }finally{enhancing=false;}
}
document.addEventListener('freebuildv8:change',()=>queueMicrotask(()=>{try{window.__AQA_SANDBOX_V4?.render?.();}catch{};queueMicrotask(enhance);}));
document.addEventListener('practicallab:runstate',()=>queueMicrotask(gate));
window.addEventListener('pointerup',e=>{if(!wireDrag)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('[data-fb-port]'),from=wireDrag.from,previous=wireDrag.previous;wireDrag=null;document.body.classList.remove('fb-wiring');if(target&&target.dataset.fbPort!==from){api().connect(from,target.dataset.fbPort);selectedPort=null;}else if(previous&&previous!==from){api().connect(previous,from);selectedPort=null;}else selectedPort=from;});
const prevRender=renderPractical;renderPractical=function(){const out=prevRender.apply(this,arguments);queueMicrotask(enhance);return out;};
observer=new MutationObserver(()=>queueMicrotask(enhance));observer.observe(document.body,{subtree:true,childList:true});
window.__freeBuildBenchV8.refresh=enhance;window.__freeBuildBenchV8Ready=true;queueMicrotask(enhance);
})();