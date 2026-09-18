(()=>{
'use strict';
if(window.__experimentalSandboxV4Ready)return;

const CFG={
1:{at:['ATa','ATb','ATc','ATi'],items:[['gen','Signal generator'],['vib','Vibration generator'],['string','String'],['pulley','Pulley'],['mass','Mass hanger'],['rule','Metre rule']],links:[['gen','vib'],['vib','string'],['string','pulley'],['pulley','mass']],cal:['Align the vibrator, string and pulley','Measure the active vibrating length between effective end points','Change only one independent variable at a time'],faults:[['Pulley friction','Tension differs from the hanging weight',1.025],['Length reference error','The measured length includes an inactive string section',0.975],['Resonance judgement','The chosen resonance frequency is slightly offset',1.018]]},
2:{at:['ATa','ATj'],items:[['light','Monochromatic light source'],['slits','Double slit'],['grating','Diffraction grating'],['screen','Screen'],['rule','Metre rule'],['caliper','Vernier calipers']],links:[['light','slits',0],['slits','screen',0],['light','grating',1],['grating','screen',1]],cal:['Align source, optical element and screen on one axis','Measure screen distance from the slit/grating plane','Use a measured slit spacing or stated grating spacing'],faults:[['Poor alignment','The optical elements are not on a common axis',0.965],['Distance reference error','Screen distance is measured from the wrong reference plane',1.035],['Spacing error','Slit or grating spacing is misread',0.97]]},
3:{at:['ATa','ATc','ATd','ATk'],items:[['release','Release mechanism'],['ball','Ball bearing'],['plumb','Plumb line'],['detector','Impact pad / light gate'],['timer','Timer / data logger'],['rule','Metre rule']],links:[['release','ball'],['ball','detector'],['detector','timer']],cal:['Use the plumb line to establish a vertical fall','Measure release-to-detector distance consistently','Reset/zero the timer before a run'],faults:[['Release delay','The timing start has a small systematic delay',0.985],['Height reference error','Fall distance is measured between inconsistent points',1.02],['Poor vertical alignment','The detector is not centred beneath the release',0.97]]},
4:{at:['ATa','ATc','ATe'],items:[['support','Rigid support'],['ref','Reference wire'],['test','Test wire'],['masses','Mass hangers'],['vernier','Vernier comparison / spirit level'],['micro','Micrometer']],links:[['support','ref'],['support','test'],['test','masses'],['ref','vernier'],['test','vernier']],cal:['Set the initial reference and test wires taut','Centre the comparison/spirit-level reference before readings','Measure wire diameter in several places/orientations'],faults:[['Zero offset','The extension reference is not zeroed',1.03],['Diameter bias','The wire diameter is overestimated',0.94],['Creep / settling','A reading is taken before the wire settles',1.02]]},
5:{at:['ATa','ATb','ATe','ATf'],items:[['psu','DC power supply'],['amm','Ammeter'],['wire','Resistance wire'],['slide','Sliding contact'],['volt','Voltmeter'],['rule','Metre rule'],['micro','Micrometer'],['switch','Switch']],links:[['psu','amm'],['amm','wire'],['wire','psu'],['volt','wire']],cal:['Place the ammeter in the series current path','Connect the voltmeter across only the selected wire length','Measure diameter at several positions and avoid prolonged heating'],faults:[['Wire heating','Resistance rises as the wire warms',1.04],['Voltmeter span error','The potential-difference leads span the wrong length',0.96],['Diameter zero error','Micrometer zero error biases cross-sectional area',1.03]]},
6:{at:['ATb','ATf','ATg'],items:[['cell','Cell / battery'],['amm','Ammeter'],['var','Variable resistor'],['switch','Switch'],['volt','Voltmeter']],links:[['cell','amm'],['amm','var'],['var','switch'],['switch','cell'],['volt','cell']],cal:['Check the voltmeter is across the cell terminals','Check the ammeter and variable resistor are in series','Open the switch between readings to reduce changes in the cell'],faults:[['Cell warming/discharge','EMF changes slightly during a long run',0.985],['Voltmeter placement','Terminal p.d. is measured at the wrong points',1.025],['Contact resistance','Extra connection resistance affects the gradient',0.97]]},
7:{at:['ATa','ATb','ATc','ATh','ATi'],items:[['clamp','Clamp / support'],['pend','Pendulum + bob',0],['fid','Fiducial marker',0],['spring','Spring',1],['mass','Mass hanger',1],['timer','Timer / oscilloscope'],['rule','Metre rule']],links:[['clamp','pend',0],['pend','fid',0],['pend','timer',0],['clamp','spring',1],['spring','mass',1],['mass','timer',1]],cal:['Use a small oscillation amplitude','Measure pendulum length to the bob centre or mass from equilibrium','Time several complete oscillations and divide by the number'],faults:[['Large amplitude','Motion departs slightly from the small-amplitude model',1.02],['Length reference error','Pendulum length is not measured to the bob centre',0.975],['Cycle-count error','One oscillation is missed in timing',1.035]]},
8:{at:['ATa'],items:[['syringe','Gas syringe',0],['seal','Plunger / rubber seal',0],['masses','Mass holder + slotted masses',0],['micro','Micrometer',0],['cap','Sealed capillary',1],['bath','Water bath',1],['therm','Thermometer',1],['rule','Ruler',1]],links:[['syringe','seal',0],['seal','masses',0],['cap','bath',1],['therm','bath',1],['rule','cap',1]],cal:['Allow the system to settle before reading','Read analogue scales consistently and at eye level','For Charles law, use absolute temperature in kelvin for analysis'],faults:[['Thermal lag','A reading is taken before thermal equilibrium',0.97],['Scale parallax','Volume/length is read from an angle',1.025],['Seal-area error','Plunger/seal diameter gives a biased area',1.035]]},
9:{at:['ATb','ATf','ATg','ATk'],items:[['source','DC source'],['switch','Two-position / changeover switch'],['cap','Capacitor'],['res','Resistor'],['volt','Voltmeter / data logger']],links:[['source','switch'],['switch','cap'],['cap','res'],['res','switch'],['volt','cap']],cal:['Check the voltmeter/data logger is across the capacitor','Set a known initial charged/uncharged condition','Use a consistent switching time origin'],faults:[['Timing offset','The time origin is shifted during switching',1.02],['Meter loading','The measuring device changes the effective discharge path',0.97],['Initial-condition error','The capacitor does not start at the intended voltage',0.95]]},
10:{at:['ATa','ATb','ATf','ATg'],items:[['balance','Top-pan balance'],['magnet','Magnet assembly'],['wire','Current-carrying wire'],['psu','DC power supply'],['amm','Ammeter'],['var','Variable resistor'],['rule','Ruler']],links:[['magnet','balance'],['wire','magnet'],['psu','amm'],['amm','var'],['var','wire'],['wire','psu']],cal:['Zero the balance with no current','Measure only the wire length inside the magnetic-field region','Change one of B, I or active length while holding the others fixed'],faults:[['Balance zero error','The balance has a small offset',1.03],['Active-length error','Too much wire is counted as lying in the field',0.96],['Field-position error','The wire is not centred in the strongest field region',0.94]]},
11:{at:['ATa','ATb','ATf','ATh'],items:[['field','Field coil'],['search','Search coil'],['pro','Protractor'],['scope','Oscilloscope'],['gen','Signal generator']],links:[['gen','field'],['search','scope'],['search','field']],cal:['Keep the search coil centred while changing its angle','Define the zero-angle convention clearly','Keep drive amplitude/frequency fixed while angle changes'],faults:[['Off-centre coil','The search coil samples a weaker field',0.95],['Angle zero error','The protractor zero is offset',1.03],['Drive drift','Signal-generator amplitude changes between readings',1.025]]},
12:{at:['ATa','ATb','ATk','ATl'],items:[['holder','Fixed virtual source holder'],['gm','GM tube'],['scaler','Scaler / timer'],['rule','Distance scale'],['screen','Virtual shielding / fixed geometry']],links:[['holder','gm'],['gm','scaler'],['rule','holder'],['rule','gm']],cal:['Use consistent source-detector reference points in the simulation','Measure a background count and apply background correction','Use sufficiently long counting intervals to reduce percentage counting uncertainty'],faults:[['Background not corrected','Background counts remain in the plotted rate',1.06],['Distance reference error','Distance is measured from inconsistent reference points',0.94],['Short count interval','Random counting scatter is larger',1.03]],safety:'Simulation only. Real ionising-radiation work must be teacher-controlled; this app gives no source-handling procedure.'}
};

const clean=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modeOK=(entry,m)=>entry.length<3||entry[2]===undefined||entry[2]===m;
const key=()=>`${current.id}_${currentMode}`;
function rootState(){state.sandboxV4=state.sandboxV4||{};return state.sandboxV4;}
function session(){
  const s=rootState(),k=key();
  if(!s[k])s[k]={mode:'guided',placed:[],positions:{},links:[],cal:{},selected:null,depth:false,fault:null,faultRevealed:false};
  return s[k];
}
function cfg(){return CFG[current?.id]||null;}
function items(){const c=cfg();return c?c.items.filter(x=>modeOK(x,currentMode)):[];}
function edges(){const c=cfg();return c?c.links.filter(x=>modeOK(x,currentMode)).map(x=>[x[0],x[1]]):[];}
function edgeKey(a,b){return [a,b].sort().join('|');}
function activeIds(){return new Set(items().map(x=>x[0]));}
function ensureSession(){
  const s=session(),valid=activeIds();
  s.placed=s.placed.filter(id=>valid.has(id));
  s.links=s.links.filter(k=>k.split('|').every(id=>valid.has(id)));
  return s;
}
function validate(){
  if(!current||!cfg())return {ready:false,score:0,missing:[],links:[],cal:[]};
  const s=ensureSession(),req=items().map(x=>x[0]),missing=req.filter(id=>!s.placed.includes(id));
  const missLinks=edges().filter(([a,b])=>!s.links.includes(edgeKey(a,b)));
  const missCal=cfg().cal.filter((_,i)=>!s.cal[i]);
  const total=req.length+edges().length+cfg().cal.length;
  const done=total-missing.length-missLinks.length-missCal.length;
  return {ready:done===total,score:total?Math.round(done/total*100):100,missing,links:missLinks,cal:missCal};
}
function setMode(mode){
  const s=session();s.mode=mode;
  if(mode==='guided'&&s.placed.length===0)referenceSetup(false);
  save();render();
}
function referenceSetup(doRender=true){
  const s=session();s.placed=items().map(x=>x[0]);s.links=edges().map(([a,b])=>edgeKey(a,b));cfg().cal.forEach((_,i)=>s.cal[i]=true);
  s.positions={};
  s.placed.forEach((id,i)=>s.positions[id]={x:8+(i%4)*23,y:15+Math.floor(i/4)*35});
  save();if(doRender)render();
}
function clearSetup(){const s=session();s.placed=[];s.links=[];s.cal={};s.selected=null;s.fault=null;s.faultRevealed=false;save();render();}
function add(id){
  const s=session();if(!s.placed.includes(id)){s.placed.push(id);const i=s.placed.length-1;s.positions[id]={x:8+(i%4)*23,y:15+Math.floor(i/4)*35};save();render();}
}
function remove(id){const s=session();s.placed=s.placed.filter(x=>x!==id);s.links=s.links.filter(k=>!k.split('|').includes(id));delete s.positions[id];if(s.selected===id)s.selected=null;save();render();}
function connect(id){
  const s=session();
  if(!s.selected){s.selected=id;render();return;}
  if(s.selected===id){s.selected=null;render();return;}
  const k=edgeKey(s.selected,id);
  s.links=s.links.includes(k)?s.links.filter(x=>x!==k):[...s.links,k];
  s.selected=null;save();render();
}
function toggleCal(i){const s=session();s.cal[i]=!s.cal[i];save();render();}
function injectFault(){
  const fs=cfg().faults||[];if(!fs.length)return;
  const s=session(),pick=fs[Math.floor(Math.random()*fs.length)];s.fault={name:pick[0],effect:pick[1],factor:pick[2]||1.02};s.faultRevealed=false;save();render();
}
function revealFault(){const s=session();s.faultRevealed=true;save();render();}
function itemName(id){return items().find(x=>x[0]===id)?.[1]||id;}
function updateRecordGate(){
  const btn=document.querySelector('#recordBtn');if(!btn||!current)return;
  const s=session(),v=validate(),enforce=s.mode==='challenge';
  btn.disabled=enforce&&!v.ready;
  btn.title=enforce&&!v.ready?'Complete and validate the challenge setup before recording.':'';
}
function benchHTML(){
  const s=session();
  const nodes=s.placed.map(id=>{const p=s.positions[id]||{x:10,y:10};return `<div class="sb-item ${s.selected===id?'selected':''}" data-sb-item="${id}" style="left:${p.x}%;top:${p.y}%"><button class="sb-drag" data-sb-drag="${id}" aria-label="Move ${clean(itemName(id))}">⋮⋮</button><b>${clean(itemName(id))}</b><span><button data-sb-link="${id}">${s.selected===id?'Cancel':'Connect'}</button><button data-sb-remove="${id}" aria-label="Remove">×</button></span></div>`}).join('');
  const links=s.links.map(k=>{const [a,b]=k.split('|');return `<span class="sb-link-chip">${clean(itemName(a))} ↔ ${clean(itemName(b))}</span>`}).join('');
  return `<div class="sb-bench ${s.depth?'depth':''}" id="sandboxBench"><div class="sb-bench-grid"></div>${nodes}<div class="sb-link-list">${links||'<span>Connections and alignments appear here.</span>'}</div></div>`;
}
function render(){
  if(!current||!cfg())return;
  const anchor=document.querySelector('.workbench');if(!anchor)return;
  let el=document.querySelector('#experimentalSandboxV4');
  if(!el){el=document.createElement('details');el.id='experimentalSandboxV4';el.className='sandbox-v4';anchor.after(el);}
  const s=ensureSession(),v=validate(),challenge=s.mode==='challenge';
  const c=cfg(),available=items().filter(x=>!s.placed.includes(x[0]));
  const missingNames=v.missing.map(itemName);
  const status=v.ready?'Ready to measure':`${v.score}% setup complete`;
  el.innerHTML=`<summary><span><b>Experimental sandbox</b><small>Build · connect · calibrate · diagnose</small></span><span class="sb-status ${v.ready?'ready':''}">${status}</span></summary>
  <div class="sb-shell">
    <div class="sb-toolbar" role="group" aria-label="Sandbox mode">
      <button data-sb-mode="guided" class="${s.mode==='guided'?'active':''}">Guided</button>
      <button data-sb-mode="sandbox" class="${s.mode==='sandbox'?'active':''}">Sandbox</button>
      <button data-sb-mode="challenge" class="${s.mode==='challenge'?'active':''}">Challenge</button>
      <span class="sb-spacer"></span>
      <button data-sb-reference>Reference setup</button><button data-sb-clear>Empty bench</button><button data-sb-depth>${s.depth?'Flat view':'Depth view'}</button>
    </div>
    <div class="sb-aqa-row"><span>AQA ${c.at.join(' · ')}</span><span>${current.title}</span><a href="${clean(window.AQA_GUIDE||'https://www.aqa.org.uk/resources/science/as-and-a-level/physics-7407-7408/teach/practicals-apparatus-set-up-guides')}" target="_blank" rel="noopener">AQA guide ↗</a></div>
    <div class="sb-grid">
      <aside class="sb-tray"><h4>Apparatus tray</h4>${available.length?available.map(x=>`<button data-sb-add="${x[0]}"><span>＋</span>${clean(x[1])}</button>`).join(''):'<p>All required apparatus is on the bench.</p>'}</aside>
      <div>${benchHTML()}</div>
      <aside class="sb-checks"><h4>${challenge?'Challenge checks':'Setup validation'}</h4>
        ${challenge?`<p>Build the apparatus without the reference checklist. ${v.ready?'All validation rules now pass.':'The setup is not ready yet.'}</p>`:
        `<ul>${missingNames.map(n=>`<li>Place ${clean(n)}</li>`).join('')}${v.links.map(([a,b])=>`<li>Connect/align ${clean(itemName(a))} with ${clean(itemName(b))}</li>`).join('')}${v.cal.map(x=>`<li>${clean(x)}</li>`).join('')||'<li class="done">All AQA setup checks pass.</li>'}</ul>`}
        <div class="sb-cal">${c.cal.map((x,i)=>`<button data-sb-cal="${i}" class="${s.cal[i]?'done':''}"><span>${s.cal[i]?'✓':'○'}</span>${clean(x)}</button>`).join('')}</div>
        <div class="sb-fault"><button data-sb-fault>Introduce hidden fault</button>${s.fault?`<button data-sb-diagnose>${s.faultRevealed?'Fault identified':'Diagnose setup'}</button>`:''}${s.fault&&s.faultRevealed?`<p><b>${clean(s.fault.name)}</b><br>${clean(s.fault.effect)}</p>`:''}</div>
      </aside>
    </div>
    ${c.safety?`<p class="sb-safety">${clean(c.safety)}</p>`:''}
  </div>`;
  bind(el);updateRecordGate();
}
function bind(el){
  el.querySelectorAll('[data-sb-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.sbMode));
  el.querySelector('[data-sb-reference]').onclick=()=>referenceSetup();
  el.querySelector('[data-sb-clear]').onclick=clearSetup;
  el.querySelector('[data-sb-depth]').onclick=()=>{const s=session();s.depth=!s.depth;save();render();};
  el.querySelectorAll('[data-sb-add]').forEach(b=>b.onclick=()=>add(b.dataset.sbAdd));
  el.querySelectorAll('[data-sb-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();remove(b.dataset.sbRemove);});
  el.querySelectorAll('[data-sb-link]').forEach(b=>b.onclick=e=>{e.stopPropagation();connect(b.dataset.sbLink);});
  el.querySelectorAll('[data-sb-cal]').forEach(b=>b.onclick=()=>toggleCal(+b.dataset.sbCal));
  el.querySelector('[data-sb-fault]').onclick=injectFault;
  const diag=el.querySelector('[data-sb-diagnose]');if(diag)diag.onclick=revealFault;
  el.querySelectorAll('[data-sb-drag]').forEach(handle=>{
    handle.onpointerdown=e=>{
      e.preventDefault();const id=handle.dataset.sbDrag,node=handle.closest('.sb-item'),bench=el.querySelector('#sandboxBench');
      if(!node||!bench)return;handle.setPointerCapture?.(e.pointerId);
      const move=ev=>{const r=bench.getBoundingClientRect();let x=(ev.clientX-r.left)/r.width*100,y=(ev.clientY-r.top)/r.height*100;x=Math.max(1,Math.min(83,x));y=Math.max(2,Math.min(72,y));node.style.left=x+'%';node.style.top=y+'%';session().positions[id]={x,y};};
      const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);save();};
      document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
    };
  });
}
const priorTheory=window.theoretical;
if(typeof priorTheory==='function'){
  window.theoretical=function(vals){
    const out=priorTheory(vals);
    try{
      if(!current||!CFG[current.id])return out;
      const s=session();
      if(!s.fault||!(s.mode==='challenge'||s.mode==='sandbox'))return out;
      const f=Number(s.fault.factor)||1;
      return {...out,y:Number.isFinite(out.y)?out.y*f:out.y,read:{...out.read}};
    }catch{return out;}
  };
}
const priorRender=window.renderPractical;
if(typeof priorRender==='function'){
  window.renderPractical=function(){const r=priorRender.apply(this,arguments);queueMicrotask(render);return r;};
}
window.addEventListener('practicallab:runstate',updateRecordGate);
window.__AQA_SANDBOX_V4={version:'4.0',config:CFG,session,validate,referenceSetup,clearSetup,render};
window.__experimentalSandboxV4Ready=true;
if(current)queueMicrotask(render);
})();