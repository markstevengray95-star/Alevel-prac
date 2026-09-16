(()=>{
const prevTheoretical=theoretical;
const prevRenderControls=renderControls;
const prevRenderData=renderData;
const prevRunExperiment=runExperiment;

const axisMeta=()=>{
  if(!current)return null;
  if(current.id===1){
    if(currentMode===0)return ['1 / length / m⁻¹','resonant frequency / Hz'];
    if(currentMode===1)return ['√tension / N^½','resonant frequency / Hz'];
    return ['1 / √linear density','resonant frequency / Hz'];
  }
  if(current.id===2)return currentMode===0?['screen distance / m','fringe spacing / mm']:['diffraction order n','sin θ'];
  if(current.id===3)return ['time² / s²','fall distance / m'];
  if(current.id===4)return ['strain','stress / MPa'];
  if(current.id===5)return ['selected length / m','resistance / Ω'];
  if(current.id===6)return ['current / A','terminal pd / V'];
  return null;
};

function gratingOrder(vals=getVals()){
  const k='p2_grating_order';
  if(state[k]==null)state[k]=1;
  // A once-valid order may disappear when wavelength rises or spacing falls.
  // Keep the saved order in the physically allowed range used by the slider.
  const [wavelength,,spacing]=vals;
  const maxOrder=Math.max(1,Math.min(5,Math.floor((spacing*1e-3)/(wavelength*1e-9))));
  const order=Math.max(1,Math.min(maxOrder,Math.round(+state[k]||1)));
  state[k]=order;
  return order;
}

function p2Theory(vals=getVals()){
  const [lnm,D,smm]=vals,lam=lnm*1e-9;
  if(currentMode===0){
    const s=smm*1e-3,w=lam*D/s;
    return {x:D,y:w*1000,read:{Fringe:`${(w*1000).toFixed(2)} mm`,Distance:`${D.toFixed(2)} m`,Wavelength:`${lnm.toFixed(0)} nm`,Span5:`${(w*5000).toFixed(1)} mm`}};
  }
  const d=smm*1e-3,n=gratingOrder(vals),sintheta=n*lam/d;
  const valid=sintheta<=1,theta=valid?Math.asin(sintheta):NaN;
  return {x:n,y:valid?sintheta:NaN,read:{Order:`n = ${n}`,Angle:valid?`${(theta*180/Math.PI).toFixed(2)}°`:'not allowed',sinθ:valid?sintheta.toFixed(4):'—',Wavelength:`${lnm.toFixed(0)} nm`}};
}

function p3Theory(vals=getVals()){
  const [h,res,off]=vals;
  const ideal=Math.sqrt(2*h/9.81);
  const resolution=Math.max(0.0001,res/1000);
  const t=Math.round((ideal+off/1000)/resolution)*resolution;
  const gest=2*h/(t*t);
  return {x:t*t,y:h,read:{Time:`${t.toFixed(4)} s`,Height:`${h.toFixed(2)} m`,Resolution:`${res.toFixed(1)} ms`,'t²':`${(t*t).toFixed(4)} s²`,'g estimate':`${gest.toFixed(3)} m s⁻²`}};
}

function p4Theory(vals=getVals()){
  const [F,L,dmm]=vals,d=dmm/1000,A=Math.PI*d*d/4,E=2e11;
  const stress=F/A,strain=stress/E,ext=strain*L;
  return {x:strain,y:stress/1e6,read:{Extension:`${(ext*1000).toFixed(3)} mm`,Stress:`${(stress/1e6).toFixed(1)} MPa`,Strain:strain.toExponential(3),Direction:currentMode===0?'loading':'unloading'}};
}

theoretical=function(vals=getVals()){
  if(current?.id===2)return p2Theory(vals);
  if(current?.id===3)return p3Theory(vals);
  if(current?.id===4)return p4Theory(vals);
  return prevTheoretical(vals);
};

renderControls=function(){
  prevRenderControls();
  if(current?.id===2&&currentMode===1){
    let vals=getVals(),lnm=vals[0],d=vals[2]*1e-3,maxOrder=Math.max(1,Math.min(5,Math.floor(d/(lnm*1e-9))));
    let box=document.createElement('div');box.className='control';
    box.innerHTML=`<label><span>Diffraction order n</span><b id="p2OrderVal">${gratingOrder()}</b></label><input id="p2Order" type="range" min="1" max="${maxOrder}" step="1" value="${Math.min(gratingOrder(),maxOrder)}"><small style="display:block;margin-top:7px;color:var(--muted);font-size:9px">Only orders satisfying nλ ≤ d are possible.</small>`;
    document.querySelector('#controls').appendChild(box);
    box.querySelector('input').oninput=e=>{state.p2_grating_order=+e.target.value;box.querySelector('#p2OrderVal').textContent=e.target.value;save();renderScene();updateReadouts();};
  }
};

renderData=function(){
  const m=axisMeta();
  if(!m)return prevRenderData();
  const ox=current.x,oy=current.y;current.x=m[0];current.y=m[1];
  try{return prevRenderData();}finally{current.x=ox;current.y=oy;}
};

renderP2Scene=function(){
  const v=getVals(),t=simT*speed,[lnm,D,smm]=v,lam=lnm*1e-9;
  let pattern='';
  if(currentMode===0){
    const wmm=lam*D/(smm*1e-3)*1000,spacing=Math.max(6,Math.min(27,wmm*7));
    pattern=Array.from({length:17},(_,i)=>{const n=i-8,x=742+n*spacing,envelope=Math.exp(-Math.abs(n)/8);return `<rect x="${x-1.5}" y="111" width="3" height="128" rx="1.5" fill="#f7d66a" opacity="${(.18+.82*envelope).toFixed(2)}" filter="url(#screenGlow)"/>`}).join('');
  }else{
    const d=smm*1e-3,maxN=Math.min(5,Math.floor(d/lam));
    pattern=Array.from({length:maxN*2+1},(_,j)=>{const n=j-maxN,s=n*lam/d;if(Math.abs(s)>=1)return '';const th=Math.asin(s),x=742+Math.tan(th)*D*42;if(x<694||x>790)return '';return `<rect x="${x-2}" y="111" width="${n===0?6:4}" height="128" rx="2" fill="#f8df78" opacity="${n===0?1:.8}" filter="url(#screenGlow)"/>`;}).join('');
  }
  const beamOpacity=running?.72:.35;
  return sceneBase(`${stand(146,250,155)}<g data-part="Laser / monochromatic source" filter="url(#shadow)"><rect x="105" y="188" width="104" height="38" rx="8" fill="#273b43" stroke="#162126" stroke-width="3"/><circle cx="204" cy="207" r="8" fill="#ef6457" filter="url(#screenGlow)"/><line x1="212" y1="207" x2="664" y2="207" stroke="#ef6958" stroke-width="2.6" opacity="${beamOpacity}"/></g><g data-part="${currentMode===0?'Double slit':'Diffraction grating'}" filter="url(#shadow)"><rect x="330" y="150" width="20" height="114" rx="3" fill="#303d3b" stroke="#171e1d" stroke-width="2"/>${currentMode===0?'<line x1="340" y1="184" x2="340" y2="195" stroke="#fff" stroke-width="2"/><line x1="340" y1="218" x2="340" y2="229" stroke="#fff" stroke-width="2"/>':'<g stroke="#e8eee9">'+Array.from({length:15},(_,i)=>`<line x1="${333+i}" y1="159" x2="${333+i}" y2="255" stroke-width=".8"/>`).join('')+'</g>'}</g><g data-part="Screen" filter="url(#shadow)"><rect x="676" y="90" width="135" height="170" rx="5" fill="#ecebe2" stroke="#666f6b" stroke-width="4"/><rect x="690" y="102" width="107" height="146" fill="#151918" opacity="${running?.92:.65}"/>${pattern}</g>${ruler(232,247,445,10,false)}<g data-part="Distance markers"><line x1="340" y1="275" x2="742" y2="275" stroke="#42504d" stroke-width="2"/><path d="M340 268v14M742 268v14" stroke="#42504d" stroke-width="2"/><text x="541" y="293" text-anchor="middle" font-size="9" fill="#33423e">D = ${D.toFixed(2)} m</text></g>${label(95,174,'light source')}${label(300,139,currentMode===0?'double slit':'grating')}${label(703,78,'screen')}`);
};

renderP3Scene=function(){
  const v=getVals(),h=v[0],th=p3Theory(v),fallTime=parseFloat(th.read.Time),cycle=fallTime+1.0,elapsed=running?(simT%cycle):0;
  const fallElapsed=Math.min(elapsed,fallTime),frac=Math.min(1,(fallElapsed/fallTime)**2),y=104+frac*226,hit=elapsed>=fallTime&&elapsed<fallTime+.22;
  const detector=currentMode===0?`<g data-part="Light gate"><rect x="171" y="300" width="95" height="14" rx="4" fill="#2e3937"/><rect x="171" y="300" width="10" height="45" fill="#2e3937"/><rect x="255" y="300" width="10" height="45" fill="#2e3937"/><line x1="181" y1="321" x2="255" y2="321" stroke="#d3eca6" stroke-width="2" opacity="${hit?1:.45}"/></g>`:`<g data-part="Impact pad"><rect x="175" y="324" width="88" height="22" rx="6" fill="${hit?'#d3eca6':'#d7ddd9'}" stroke="#4d5955" stroke-width="3"/><circle cx="219" cy="335" r="12" fill="#222a27"/></g>`;
  return sceneBase(`${stand(205,250,190)}<g data-part="Release mechanism" filter="url(#shadow)"><rect x="184" y="70" width="70" height="32" rx="5" fill="#3b5a60"/><circle cx="219" cy="104" r="10" fill="#697975"/></g><g data-part="Ball bearing" filter="url(#softShadow)"><circle cx="219" cy="${y}" r="12" fill="url(#metal)" stroke="#4d5a57" stroke-width="2"/></g>${detector}<g data-part="Data logger" filter="url(#shadow)"><rect x="390" y="178" width="130" height="82" rx="9" fill="url(#orange)"/><rect x="414" y="194" width="80" height="30" rx="3" class="meter-screen"/><text x="454" y="215" text-anchor="middle" font-family="monospace" font-size="13">${elapsed>=fallTime?fallTime.toFixed(4):fallElapsed.toFixed(4)} s</text></g>${ruler(286,92,238,12,true)}<g data-part="Plumb line"><line x1="330" y1="92" x2="330" y2="330" stroke="#d8e1de" stroke-width="2" stroke-dasharray="5 5"/><circle cx="330" cy="333" r="5" fill="#777"/></g>${label(140,58,'release')}${label(376,165,'data logger')}${label(278,81,'distance scale')}${label(338,92,'plumb line')}`);
};

runExperiment=function(){
  if(current?.id===6){
    running=true;methodStep=Math.min(current.method.length-1,Math.max(methodStep,2));renderCoach();renderScene();beep();
    clearTimeout(window.__p6Timer);window.__p6Timer=setTimeout(()=>{if(current?.id===6){running=false;renderScene();}},1200);
    return;
  }
  return prevRunExperiment();
};
})();
