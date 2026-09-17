/* Run sequences for AQA practicals 5 and 6. The circuit cues are schematic:
   steady DC is shown by a lit conducting path, not travelling electrons. */
(()=>{
'use strict';
const priorTheory=theoretical;
const priorRun=runExperiment;
const priorReset=resetExperiment;
let p5Held=null,p6Held=null;
const signature=v=>v.map(x=>Number(x).toPrecision(7)).join('|');
const p5Signature=v=>`${currentMode}|${signature(v)}`;
const p5Pair=v=>{const [L,V,dmm]=v,A=Math.PI*(dmm/1000)**2/4,R=4.9e-7*L/A;return {R,I:V/R,V};};
const p6Pair=v=>{const [R,e,r]=v,I=e/(R+r);return {I,V:e-I*r};};

theoretical=function(vals=getVals()){
  const out=priorTheory(vals);
  if(current?.id===5){
    const pair=p5Pair(vals),held=p5Held?.signature===p5Signature(vals);
    if(currentMode===1)out.x=1/(vals[2]*vals[2]);
    out.read={Resistance:`${pair.R.toFixed(3)} Ω`,Current:running||held?`${pair.I.toFixed(3)} A`:'0.000 A',Voltage:running||held?`${pair.V.toFixed(2)} V`:'0.00 V',Length:`${vals[0].toFixed(2)} m`};
  }
  return out;
};

renderP5Scene=function(){
  const v=getVals(),[L,V,dmm]=v,pair=p5Pair(v),contactX=130+L*645;
  if(running&&simT*speed>1.45)running=false;
  if(running)p5Held={signature:p5Signature(v)};
  const held=p5Held?.signature===p5Signature(v),active=!!running;
  const response=active?1-Math.exp(-simT*speed*11):held?1:0;
  const shownI=pair.I*response,shownV=V*response;
  const wireWidth=1.7+dmm*5.2;
  const status=active?'SUPPLY ON · METERS SETTLING':held?'HOLD READING · SUPPLY OFF':'READY · SUPPLY OFF';
  const micGap=10+dmm*28;
  return sceneBase(`
    <g data-part="Power supply" filter="url(#shadow)"><rect x="350" y="109" width="143" height="103" rx="10" fill="url(#orange)" stroke="#67452d" stroke-width="3"/><rect x="367" y="124" width="110" height="34" rx="4" fill="#24332c"/><text x="422" y="146" text-anchor="middle" font-family="monospace" font-size="15" fill="#d3eca6">SET ${V.toFixed(2)} V</text><circle cx="383" cy="190" r="8" fill="#c64f42"/><circle cx="461" cy="190" r="8" fill="#252a28"/><text x="422" y="177" text-anchor="middle" fill="#fff2da" font-size="8">low-voltage supply</text></g>
    ${meter(195,125,'A',shownI.toFixed(3))}${meter(558,125,'V',shownV.toFixed(2))}
    <g data-part="Resistance wire" filter="url(#softShadow)"><rect x="118" y="282" width="670" height="18" rx="5" fill="#71523e"/><line x1="130" y1="291" x2="775" y2="291" stroke="#8b5945" stroke-width="${wireWidth}"/><line data-conducting-section x1="130" y1="291" x2="${contactX.toFixed(2)}" y2="291" stroke="${active?'#d3eca6':'#e3a17d'}" stroke-width="${wireWidth}" opacity="${active?(.45+.55*response).toFixed(3):.72}"/></g>
    ${ruler(130,320,645,12,false)}
    <g data-part="Sliding contact" filter="url(#shadow)"><path d="M${contactX} 258 l-16 28 h32z" fill="#c94d42" stroke="#772e2a" stroke-width="2"/><rect x="${contactX-9}" y="246" width="18" height="14" rx="3" fill="url(#metal)"/><circle cx="${contactX}" cy="291" r="5" fill="url(#brass)"/></g>
    ${cable('M383 190 C345 193 320 228 267 224','#c9433b')}${cable('M215 224 C180 239 143 250 130 291','#202626')}
    ${cable(`M${contactX} 278 C${Math.max(510,contactX)} 238 490 225 461 190`,'#202626')}
    ${cable('M130 280 C153 245 488 249 578 224','#355b85')}${cable(`M630 224 C665 253 ${Math.max(630,contactX)} 259 ${contactX} 278`,'#355b85')}
    <g data-part="Micrometer" filter="url(#shadow)"><path d="M716 146 q52-44 82 0 v48 q-34 44-82 0z" fill="none" stroke="url(#metal)" stroke-width="12"/><rect x="752" y="165" width="72" height="22" rx="5" fill="#6b716f"/><line x1="704" y1="176" x2="${704+micGap}" y2="176" stroke="#dbdfdd" stroke-width="6"/><text x="764" y="215" text-anchor="middle" fill="#dce5e1" font-size="8">d = ${dmm.toFixed(2)} mm</text></g>
    <g pointer-events="none"><rect x="347" y="71" width="176" height="29" rx="7" fill="#14293c" opacity=".93"/><text x="435" y="90" text-anchor="middle" fill="#d8efbf" font-size="9">${status}</text><text x="452" y="345" text-anchor="middle" fill="#f4e5c9" font-size="10">selected length ${L.toFixed(2)} m · R = ${pair.R.toFixed(3)} Ω</text></g>
    ${label(188,112,'ammeter in series')}${label(545,112,'voltmeter across selected length')}${label(103,364,'fixed contact')}${label(contactX-35,245,'movable contact')}${label(697,131,'micrometer')}`);
};

renderP6Scene=function(){
  const v=getVals(),[R,e,r]=v,pair=p6Pair(v);
  if(running&&simT*speed>1.35)running=false;
  if(running)p6Held={signature:signature(v),...pair};
  const active=!!running,held=p6Held?.signature===signature(v);
  const response=active?1-Math.exp(-simT*speed*12):0;
  const shownI=pair.I*response,shownV=e-r*shownI;
  const sliderX=370+(R-1)/19*105;
  const status=active?'SWITCH CLOSED · TAKE I AND V':held?'SWITCH OPEN · LAST PAIR SAVED':'SWITCH OPEN · READY';
  return sceneBase(`
    ${meter(165,123,'A',shownI.toFixed(3))}${meter(624,123,'V',shownV.toFixed(3))}
    <g data-part="Variable resistor" filter="url(#shadow)"><rect x="345" y="142" width="160" height="73" rx="10" fill="#303937" stroke="#171d1b" stroke-width="3"/><rect x="368" y="165" width="114" height="17" rx="7" fill="#b9b2a4"/><path d="M376 173 h98" stroke="#8a5e3a" stroke-width="5" stroke-dasharray="8 5"/><line x1="${sliderX.toFixed(2)}" y1="142" x2="${sliderX.toFixed(2)}" y2="205" stroke="#d3eca6" stroke-width="4"/><text x="425" y="200" text-anchor="middle" fill="#f4e6d1" font-size="9">R = ${R.toFixed(1)} Ω</text></g>
    <g data-part="Cell" filter="url(#shadow)"><rect x="365" y="277" width="140" height="69" rx="9" fill="#ddd3a9" stroke="#504a3b" stroke-width="3"/><rect x="380" y="287" width="108" height="30" rx="4" fill="#293932"/><text x="434" y="307" text-anchor="middle" fill="#d3eca6" font-family="monospace" font-size="11">ε ${e.toFixed(2)} V · r ${r.toFixed(2)} Ω</text><rect x="380" y="324" width="${(108*response).toFixed(2)}" height="7" rx="2" fill="#cf8664"/><text x="434" y="340" text-anchor="middle" fill="#564b3e" font-size="7">internal voltage drop ${ (shownI*r).toFixed(3) } V</text><circle cx="385" cy="272" r="7" fill="#c54d43"/><circle cx="487" cy="272" r="7" fill="#252a28"/></g>
    <g data-part="Switch" filter="url(#softShadow)"><rect x="536" y="269" width="88" height="52" rx="8" fill="#d9dedb" stroke="#616d68"/><circle cx="550" cy="294" r="6" fill="#333"/><circle cx="607" cy="294" r="6" fill="#333"/><line x1="550" y1="294" x2="${active?607:588}" y2="${active?294:276}" stroke="url(#metal)" stroke-width="6" stroke-linecap="round"/></g>
    ${cable('M385 272 C333 246 271 248 185 223','#c9433b')}${cable('M237 223 C290 219 319 177 345 177','#202626')}
    ${cable('M505 177 C533 183 552 233 550 294','#c9433b')}${cable('M607 294 C585 333 518 334 487 272','#202626')}
    ${cable('M385 272 C322 367 655 370 644 222','#355b85')}${cable('M696 222 C755 354 550 377 487 272','#355b85')}
    <g data-part="Circuit current indicator" pointer-events="none"><path d="M260 224 C302 214 330 180 345 177" fill="none" stroke="#d3eca6" stroke-width="${active?3:0}" opacity="${(.15+.7*response).toFixed(3)}"/></g>
    <g pointer-events="none"><rect x="347" y="75" width="205" height="48" rx="8" fill="#14293c" opacity=".93"/><text x="449" y="92" text-anchor="middle" fill="#b9d5d3" font-size="8">${status}</text><text x="449" y="111" text-anchor="middle" fill="#d8efbf" font-family="monospace" font-size="10">${held&&!active?`last I ${p6Held.I.toFixed(3)} A · V ${p6Held.V.toFixed(3)} V`:`V = ε − Ir · ${shownV.toFixed(3)} V`}</text></g>
    ${label(341,128,'variable resistor')}${label(365,361,'cell with internal resistance')}${label(536,255,'switch')}${label(153,110,'series ammeter')}${label(617,110,'terminal voltmeter')}`);
};

runExperiment=function(){
  if(current?.id===5||current?.id===6){
    clearTimeout(window.__p6Timer);
    simT=0;running=true;
    methodStep=Math.min(current.method.length-1,Math.max(methodStep,2));
    renderCoach();renderScene();beep();return;
  }
  return priorRun();
};
resetExperiment=function(){
  if(current?.id===5||current?.id===6){
    clearTimeout(window.__p6Timer);
    if(current.id===5)p5Held=null;else p6Held=null;
    running=false;simT=0;methodStep=0;renderCoach();renderScene();return;
  }
  return priorReset();
};
document.addEventListener('click',event=>{
  if(current?.id!==5||currentMode!==1||event.target?.id!=='exportBtn')return;
  event.preventDefault();event.stopImmediatePropagation();
  const data=getData();if(!data.length){alert('Record some readings first.');return;}
  const csv=`1 / diameter² / mm⁻²,resistance / Ω\n${data.map(p=>`${p.x},${p.y}`).join('\n')}`;
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));link.download='AQA-P5-diameter-data.csv';link.click();URL.revokeObjectURL(link.href);
},true);
})();
