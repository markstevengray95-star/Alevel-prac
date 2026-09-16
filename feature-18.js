(()=>{
'use strict';
const T=window.PracticalTools;if(!T)return;
const store=T.suite.imperfect=T.suite.imperfect||{};
const profiles=[
 {key:'scatter',name:'Random scatter',desc:'Independent readings fluctuate around the underlying relationship.',effect:'Larger residuals and poorer repeat agreement without a consistent directional shift.'},
 {key:'zero',name:'Zero offset',desc:'The measured dependent quantity has a fixed offset.',effect:'The graph can remain very linear but develops an unexpected intercept.'},
 {key:'drift',name:'Progressive drift',desc:'The measurement drifts as the run continues.',effect:'Later readings are displaced progressively, often producing a curved residual pattern.'},
 {key:'resolution',name:'Limited resolution',desc:'Readings are rounded more strongly than the ideal model.',effect:'Data cluster on repeated displayed values or steps.'}
];
function cfg(id){return store[id]||(store[id]={enabled:false,profile:'scatter',level:2});}
function profile(id){return profiles.find(x=>x.key===cfg(id).profile)||profiles[0];}
function perturb(id,t,index){const c=cfg(id),p=profile(id),level=Math.max(1,Math.min(3,+c.level||2)),base=Math.abs(t.y)||1;let y=t.y;
 if(p.key==='scatter')y+=((Math.random()+Math.random()+Math.random())-1.5)*base*(.018*level);
 if(p.key==='zero')y+=base*(.025*level)*(t.y<0?-1:1);
 if(p.key==='drift')y+=base*(.009*level)*(index+1);
 if(p.key==='resolution'){const step=Math.max(Math.abs(y)*(.012*level),1e-6);y=Math.round(y/step)*step;}
 if(id===12)y=Math.max(0,y+((Math.random()+Math.random())-1)*Math.sqrt(Math.max(1,Math.abs(y))));
 return y;
}
const baseRecord=window.record;
if(typeof baseRecord==='function'&&!window.__imperfectRecordWrapped){
 window.record=function(repeats=1){const id=current?.id,c=id&&cfg(id);if(!id||!c?.enabled)return baseRecord.apply(this,arguments);const t=theoretical();if(!Number.isFinite(t.x)||!Number.isFinite(t.y)){alert('This setting cannot produce a valid graph point. Adjust the controls and try again.');return;}for(let i=0;i<repeats;i++){const idx=getData().length,y=perturb(id,t,idx);if(!Number.isFinite(y))continue;getData().push({x:t.x,y,rep:i+1,imperfect:true,imperfection:c.profile});}save();renderData();if(typeof beep==='function')beep();};
 window.__imperfectRecordWrapped=true;
}
function render(root,opts={}){let id=+(opts.practicalId||state.last||1),revealed=false;
 function draw(){const c=cfg(id),p=profile(id),d=T.data(id,0);root.innerHTML=`<div class="tool-panel"><div class="tool-row"><label><b>Practical</b> <select id="imP">${practicals.map(x=>`<option value="${x.id}" ${x.id===id?'selected':''}>${x.id}. ${T.esc(x.title)}</option>`).join('')}</select></label><span class="tool-pill">${c.enabled?'Imperfect recording ON':'Ideal recording'}</span></div></div><div class="tool-two"><div class="tool-panel"><span class="eyebrow">DATA REALISM</span><h3>Imperfect experiment mode</h3><p>When enabled, the workbench’s <b>Record reading</b> action uses the selected imperfection profile instead of the normal small idealised scatter.</p><label class="tool-choice"><input id="imEnable" type="checkbox" ${c.enabled?'checked':''}> Enable imperfect recording for Practical ${id}</label><label><b>Severity</b> <select id="imLevel"><option value="1" ${c.level==1?'selected':''}>Mild</option><option value="2" ${c.level==2?'selected':''}>Moderate</option><option value="3" ${c.level==3?'selected':''}>Strong</option></select></label><div class="tool-actions"><button class="secondary-btn" id="imNewFault">Generate a new hidden fault</button><button class="secondary-btn" id="imOpen">Open practical</button></div><div class="tool-callout">Use this to practise recognising measurement problems from the <i>shape of the data</i>. A straight graph can still contain systematic error.</div></div><div class="tool-panel"><h3>Diagnose the hidden fault</h3><p>Record several points in the practical, then return here. Which pattern best matches the data?</p>${profiles.map((x,i)=>`<label class="tool-choice"><input type="radio" name="imGuess" value="${x.key}"> <b>${T.esc(x.name)}</b><br><small>${T.esc(x.effect)}</small></label>`).join('')}<div class="tool-actions"><button class="primary-btn" id="imCheck">Check diagnosis</button></div><div id="imOut"></div></div></div><div class="tool-panel"><h3>Current recorded-data evidence</h3>${d.length?`<div class="tool-row"><span class="tool-pill">${d.length} points in mode 1</span><span class="tool-pill">${d.filter(x=>x.imperfect).length} imperfect-mode points</span></div><p>Inspect the graph, repeat agreement and residual pattern before diagnosing.</p>`:'<p>No readings are recorded yet. Open the practical, enable this mode, vary the independent variable and record several readings.</p>'}</div>`;
 root.querySelector('#imP').onchange=e=>{id=+e.target.value;revealed=false;draw();};root.querySelector('#imEnable').onchange=e=>{c.enabled=e.target.checked;save();draw();};root.querySelector('#imLevel').onchange=e=>{c.level=+e.target.value;save();};
 root.querySelector('#imNewFault').onclick=()=>{const old=c.profile;const rest=profiles.filter(x=>x.key!==old);c.profile=rest[Math.floor(Math.random()*rest.length)].key;c.enabled=true;save();revealed=false;draw();};root.querySelector('#imOpen').onclick=()=>navigate('practical',id);
 root.querySelector('#imCheck').onclick=()=>{const g=root.querySelector('input[name=imGuess]:checked');if(!g)return;const ok=g.value===c.profile;root.querySelector('#imOut').innerHTML=`<div class="tool-feedback ${ok?'':'warn'}"><b>${ok?'Diagnosis fits the hidden fault':'Use the evidence again'}</b><p>${ok?`${T.esc(p.name)}: ${T.esc(p.desc)}`:'Look for intercept shifts, residual drift, repeated quantised values or point-to-point scatter rather than relying only on R².'}</p></div>`;if(ok){T.mark(18,true);revealed=true;}};
 }
 draw();}
T.register(18,{title:'Imperfect Experiment mode',kicker:'REALISTIC DATA PROBLEMS',description:'Record data with hidden scatter, offset, drift or resolution limits and diagnose the pattern.',icon:'〽️',render,decorate({addPracticalButton,open}){addPracticalButton('imperfect','Imperfect data',()=>open(18,{practicalId:current?.id||state.last}));}});
})();
