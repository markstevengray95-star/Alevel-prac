function modeVar(i){
  if(current.id===2&&currentMode===1&&i===2)return ['Grating spacing','mm',0.0010,0.0040,0.00167,0.00001];
  if(current.id===7&&i===0)return currentMode===0?['Pendulum length','m',0.20,1.20,0.70,0.02]:['Oscillating mass','kg',0.10,1.00,0.40,0.02];
  if(current.id===8&&currentMode===1){if(i===0)return ['Bath temperature','°C',10,80,20,2];if(i===1)return ['Initial air length','cm',3,8,4,0.2];}
  return current.vars[i];
}
getVals=function(){const key=`vals_${current.id}_${currentMode}`;if(!state[key])state[key]=current.vars.map((v,i)=>modeVar(i)[4]);return state[key];};
displayVarName=function(i){return modeVar(i)[0];};
formatVal=function(v,u){if(!u)return Number(v).toFixed(Math.abs(v)<10&&Math.abs(v-Math.round(v))>.001?2:0);let a=Math.abs(v),d=a>0&&a<.01?5:a<10&&Math.abs(v-Math.round(v))>.001?2:Math.abs(v-Math.round(v))>.001?1:0;return `${Number(v).toFixed(d)} ${u}`;};
renderControls=function(){const vals=getVals();$('#controls').innerHTML=current.vars.map((_,i)=>{let v=modeVar(i);return `<div class="control"><label><span>${v[0]}</span><b id="val${i}">${formatVal(vals[i],v[1])}</b></label><input id="rng${i}" type="range" min="${v[2]}" max="${v[3]}" step="${v[5]}" value="${vals[i]}"></div>`}).join('');current.vars.forEach((_,i)=>{let v=modeVar(i);$(`#rng${i}`).oninput=e=>{vals[i]=+e.target.value;$(`#val${i}`).textContent=formatVal(vals[i],v[1]);save();renderScene();updateReadouts();};});updateReadouts();};
const baseTheoretical=theoretical;
theoretical=function(vals=getVals()){
  if(current&&current.id===5){let [L,V,dmm]=vals,d=dmm/1000,A=Math.PI*d*d/4,rho=4.9e-7,R=rho*L/A,I=V/R;return{x:L,y:R,read:{Resistance:`${R.toFixed(3)} Ω`,Current:`${I.toFixed(3)} A`,Voltage:`${V.toFixed(2)} V`,Length:`${L.toFixed(2)} m`}};}
  return baseTheoretical(vals);
};
function renderScene(){if(!current)return;let renderer=window['renderP'+current.id+'Scene'];let svg=renderer?renderer():sceneBase('');$('#scene').innerHTML=svg;$('#benchTitle').textContent=`Practical ${current.id} · ${current.modes[currentMode]}`;$('#benchStatus').textContent=running?'RUNNING · LIVE MODEL':'READY · CLICK RUN EXPERIMENT';$('#scene').querySelectorAll('[data-part]').forEach(g=>g.addEventListener('click',()=>inspect(g.dataset.part)));updateReadouts();}
function inspect(name){let a=current.apparatus.find(x=>x[0].toLowerCase().includes(name.toLowerCase())||name.toLowerCase().includes(x[0].toLowerCase()));$('#equipmentInspector').innerHTML=a?`<b>${a[0]}</b><p>${a[1]}</p><p><strong>Student detail:</strong> ${a[2]}</p>`:`<b>${name}</b><p>This component is part of the current AQA-style geometry.</p>`;}
window.addEventListener('load',()=>{
  if(!document.querySelector('link[data-physical-interactions]')){const l=document.createElement('link');l.rel='stylesheet';l.href='physical-interactions.css';l.dataset.physicalInteractions='1';document.head.appendChild(l);}
  const loadGeometry=()=>{if(document.querySelector('script[data-interaction-geometry]'))return;const g=document.createElement('script');g.src='interaction-geometry.js';g.async=false;g.dataset.interactionGeometry='1';document.body.appendChild(g);};
  const loadLearningExtensions=()=>{if(document.querySelector('script[data-lab-book-bootstrap]'))return;const x=document.createElement('script');x.src='lab-book-bootstrap.js?v=lab-switch-20260915';x.async=false;x.dataset.labBookBootstrap='1';document.body.appendChild(x);};
  loadLearningExtensions();
  if(!document.querySelector('script[data-physical-interactions]')){const s=document.createElement('script');s.src='physical-interactions.js';s.async=false;s.dataset.physicalInteractions='1';s.onload=loadGeometry;document.body.appendChild(s);}else loadGeometry();
});