(()=>{
const baseTheoretical=theoretical;
const baseRenderControls=renderControls;
const baseRecord=record;
const baseRenderP1=renderP1Scene;

function p1Resonance(vals=getVals()){
  const [L,T,mug]=vals;
  const mu=mug/1000;
  return (1/(2*L))*Math.sqrt(T/mu);
}
function p1Drive(){
  const k=`p1_drive_${currentMode}`;
  if(state[k]==null) state[k]=Number(p1Resonance().toFixed(1));
  return +state[k];
}
function p1Quality(){
  const f0=p1Resonance(), f=p1Drive();
  const detune=(f-f0)/Math.max(1e-9,f0);
  return 1/(1+(detune/0.035)**2);
}

theoretical=function(vals=getVals()){
  if(current&&current.id===1){
    const [L,T,mug]=vals, f0=p1Resonance(vals), f=p1Drive(), q=p1Quality();
    let x=currentMode===0?1/L:currentMode===1?Math.sqrt(T):1/Math.sqrt(mug/1000);
    return {x,y:f,read:{Drive:`${f.toFixed(1)} Hz`,Resonance:`${f0.toFixed(1)} Hz`,Amplitude:`${Math.round(q*100)}%`,Tension:`${T.toFixed(1)} N`}};
  }
  return baseTheoretical(vals);
};

renderControls=function(){
  baseRenderControls();
  if(!current||current.id!==1)return;
  const f0=p1Resonance();
  let box=document.createElement('div');box.className='control resonance-control';
  box.innerHTML=`<label><span>Drive frequency</span><b id="p1DriveVal">${p1Drive().toFixed(1)} Hz</b></label><input id="p1Drive" type="range" min="5" max="300" step="0.1" value="${p1Drive().toFixed(1)}"><small style="display:block;margin-top:7px;color:var(--muted);font-size:9px">Tune for the largest stable amplitude.</small>`;
  document.querySelector('#controls').appendChild(box);
  const input=box.querySelector('#p1Drive');
  input.oninput=e=>{state[`p1_drive_${currentMode}`]=+e.target.value;box.querySelector('#p1DriveVal').textContent=`${(+e.target.value).toFixed(1)} Hz`;save();renderScene();updateReadouts();};
};

renderP1Scene=function(){
  let v=getVals(),t=simT*speed,L=v[0],T=v[1],f0=p1Resonance(v),f=p1Drive(),q=p1Quality();
  let amp=running?4+22*q:3,phase=t*2*Math.PI*Math.min(6,Math.max(1,f/25)),pts=[];
  for(let i=0;i<=100;i++){let x=235+i*4.72,y=222+amp*Math.sin(i/100*Math.PI)*Math.sin(phase);pts.push(`${x},${y}`)}
  let mass=Math.max(80,Math.round(T/9.81*1000));
  const qualityText=q>.82?'RESONANCE':q>.4?'NEAR RESONANCE':'OFF RESONANCE';
  return sceneBase(`${stand(118,250,178)}${psu(282,137)}<g data-part="Vibration generator" filter="url(#shadow)"><rect x="178" y="190" width="66" height="54" rx="8" fill="#35474d" stroke="#1d292c" stroke-width="3"/><rect x="187" y="198" width="48" height="18" rx="3" fill="#d2d9d6"/><circle cx="211" cy="230" r="9" fill="#c8584b"/><line x1="211" y1="239" x2="235" y2="222" stroke="#dde9e4" stroke-width="3"/></g><polyline points="${pts.join(' ')}" fill="none" stroke="${q>.82?'#d3eca6':'#eef8f1'}" stroke-width="3.2" filter="url(#softShadow)"/><g data-part="Pulley" filter="url(#shadow)"><circle cx="715" cy="222" r="28" fill="url(#metal)" stroke="#394946" stroke-width="5"/><circle cx="715" cy="222" r="8" fill="#394946"/></g><line x1="743" y1="222" x2="743" y2="330" stroke="#eef8f1" stroke-width="3"/><g data-part="Mass hanger" filter="url(#shadow)"><path d="M743 330 q-12 8-12 18 h24 q0-10-12-18z" fill="url(#metal)"/><rect x="718" y="348" width="50" height="31" rx="4" fill="#5c6461"/><rect x="711" y="379" width="64" height="8" rx="3" fill="#8d9692"/><text x="743" y="369" text-anchor="middle" fill="#eef3f1" font-size="8">${mass} g</text></g>${ruler(255,248,420,10,false)}<g data-part="Fixed nodes"><circle cx="235" cy="222" r="5" fill="#d3eca6"/><circle cx="707" cy="222" r="5" fill="#d3eca6"/></g><g pointer-events="none"><rect x="510" y="145" width="165" height="50" rx="8" fill="#14293c" opacity=".9"/><text x="592" y="164" text-anchor="middle" fill="#8faab4" font-size="8">${qualityText}</text><text x="592" y="184" text-anchor="middle" fill="#d8efbf" font-family="monospace" font-size="13">drive ${f.toFixed(1)} Hz · f₀ ${f0.toFixed(1)} Hz</text></g>${label(164,182,'vibration generator')}${label(286,126,'signal generator')}${label(676,188,'pulley')}${label(689,402,'mass hanger')}${label(398,286,'vibrating length L')}`);
};

record=function(repeats=1){
  if(current&&current.id===1&&p1Quality()<.65){alert('Tune the drive frequency closer to resonance before recording the frequency. Look for the largest stable stationary-wave amplitude.');return;}
  return baseRecord(repeats);
};
})();
