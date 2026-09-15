(()=>{
const previousRunExperiment=runExperiment;
const previousResetExperiment=resetExperiment;

function p3FallTime(){
  const [h,,off]=getVals();
  return Math.sqrt(2*h/9.81)+off/1000;
}

renderP3Scene=function(){
  const v=getVals(),h=v[0],fallTime=p3FallTime();
  const elapsed=running?Math.min(simT,fallTime):Math.min(simT,fallTime);
  const frac=fallTime>0?Math.min(1,(elapsed/fallTime)**2):0;
  const yy=104+frac*226;
  const hasLanded=simT>=fallTime;
  const sensorFlash=simT>=Math.max(0,fallTime-.035)&&simT<=fallTime+.09;
  if(running&&simT>fallTime+.12)running=false;
  const detector=currentMode===0
    ?`<g data-part="Light gate" filter="url(#softShadow)"><rect x="171" y="300" width="95" height="14" rx="4" fill="#2e3937"/><rect x="171" y="300" width="10" height="45" fill="#2e3937"/><rect x="255" y="300" width="10" height="45" fill="#2e3937"/><line x1="181" y1="321" x2="255" y2="321" stroke="${sensorFlash?'#d3eca6':'#81958e'}" stroke-width="2" opacity="${sensorFlash?1:.45}"/></g>`
    :`<g data-part="Impact pad" filter="url(#softShadow)"><rect x="175" y="324" width="88" height="22" rx="6" fill="${hasLanded?'#d3eca6':'#d7ddd9'}" stroke="#4d5955" stroke-width="3"/><circle cx="219" cy="335" r="12" fill="#222a27"/></g>`;
  const shownTime=Math.min(simT,fallTime);
  return sceneBase(`${stand(205,250,190)}<g data-part="Release mechanism" filter="url(#shadow)"><rect x="184" y="70" width="70" height="32" rx="5" fill="#3b5a60"/><circle cx="219" cy="104" r="10" fill="#697975"/><rect x="205" y="78" width="28" height="8" rx="4" fill="${running?'#d3eca6':'#94a7a0'}"/></g><g data-part="Ball bearing" filter="url(#softShadow)"><circle cx="219" cy="${yy}" r="12" fill="url(#metal)" stroke="#4d5a57" stroke-width="2"/></g>${detector}<g data-part="Data logger" filter="url(#shadow)"><rect x="390" y="178" width="130" height="82" rx="9" fill="url(#orange)"/><rect x="414" y="194" width="80" height="30" rx="3" class="meter-screen"/><text x="454" y="215" text-anchor="middle" font-family="monospace" font-size="13">${shownTime.toFixed(4)} s</text><text x="454" y="243" text-anchor="middle" fill="#f2eadf" font-size="8">${hasLanded?'CAPTURED':'TIMING'}</text></g>${ruler(286,92,238,12,true)}<g data-part="Plumb line"><line x1="330" y1="92" x2="330" y2="330" stroke="#d8e1de" stroke-width="2" stroke-dasharray="5 5"/><circle cx="330" cy="333" r="5" fill="#777"/></g><g pointer-events="none"><rect x="535" y="168" width="175" height="64" rx="8" fill="#14293c" opacity=".9"/><text x="622" y="187" text-anchor="middle" fill="#8faab4" font-size="8">FALL MODEL</text><text x="622" y="207" text-anchor="middle" fill="#d8efbf" font-family="monospace" font-size="12">h = ${h.toFixed(2)} m</text><text x="622" y="224" text-anchor="middle" fill="#d8efbf" font-family="monospace" font-size="10">t = ${fallTime.toFixed(4)} s</text></g>${label(140,58,'release')}${label(376,165,'data logger')}${label(278,81,'distance scale')}${label(338,92,'plumb line')}`);
};

renderP4Scene=function(){
  const v=getVals(),F=v[0],th=theoretical(v),target=Math.min(18,parseFloat(th.read.Extension)*36);
  const settle=running?1-Math.exp(-Math.max(0,simT)*4.5):1;
  const move=target*settle;
  const loadMass=Math.round(F/9.81*1000);
  const direction=currentMode===0?'LOADING':'UNLOADING';
  return sceneBase(`<g data-part="Rigid support" filter="url(#shadow)"><rect x="108" y="51" width="580" height="22" rx="4" fill="url(#darkMetal)"/><rect x="116" y="52" width="14" height="272" fill="url(#darkMetal)"/><rect x="666" y="52" width="14" height="272" fill="url(#darkMetal)"/></g><g data-part="Reference wire"><line x1="326" y1="73" x2="326" y2="320" stroke="#b7c0bd" stroke-width="2.4"/><rect x="304" y="316" width="44" height="36" rx="5" fill="#666"/><text x="326" y="339" text-anchor="middle" fill="#eee" font-size="7">reference</text></g><g data-part="Test wire"><line x1="500" y1="73" x2="500" y2="${320+move}" stroke="#d0d7d4" stroke-width="2.4"/><g filter="url(#shadow)"><path d="M500 ${317+move} q-12 8-12 18 h24 q0-10-12-18z" fill="url(#metal)"/><rect x="475" y="${335+move}" width="50" height="31" rx="4" fill="#5b6260"/><text x="500" y="${355+move}" text-anchor="middle" fill="#eee" font-size="7">${loadMass} g</text></g></g><g data-part="Vernier scale" filter="url(#shadow)"><rect x="350" y="240" width="136" height="33" rx="5" fill="#d6dedb" stroke="#515d5a" stroke-width="2"/><g stroke="#3d4744">${Array.from({length:18},(_,i)=>`<line x1="${357+i*7}" y1="245" x2="${357+i*7}" y2="${i%5===0?267:260}"/>`).join('')}</g><rect x="405" y="233" width="22" height="47" fill="#889793" stroke="#59645f"/></g><g data-part="Spirit level" filter="url(#softShadow)"><rect x="376" y="204" width="88" height="22" rx="11" fill="#d8d592" stroke="#59615e" stroke-width="2"/><rect x="392" y="210" width="56" height="10" rx="5" fill="#edf2ce"/><circle cx="${420+(running?(1-settle)*7:0)}" cy="215" r="7" fill="#d6f19e" stroke="#77805f"/></g><g data-part="Micrometer" filter="url(#shadow)"><path d="M650 172 q60-55 98 0 v57 q-38 54-98 0z" fill="none" stroke="url(#metal)" stroke-width="14"/><rect x="698" y="195" width="80" height="24" rx="6" fill="#6b716f"/><g stroke="#dce2df">${Array.from({length:9},(_,i)=>`<line x1="${706+i*8}" y1="195" x2="${706+i*8}" y2="202"/>`).join('')}</g><rect x="634" y="197" width="22" height="16" rx="3" fill="url(#brass)"/></g><g data-part="Pointer"><line x1="427" y1="279" x2="427" y2="${304+move}" stroke="#d65b4f" stroke-width="2"/><path d="M419 ${304+move} h16 l-8 10z" fill="#d65b4f"/></g><g pointer-events="none"><rect x="547" y="98" width="125" height="45" rx="8" fill="#14293c" opacity=".9"/><text x="609" y="116" text-anchor="middle" fill="#8faab4" font-size="8">${direction}</text><text x="609" y="134" text-anchor="middle" fill="#d8efbf" font-family="monospace" font-size="10">ΔL ${th.read.Extension}</text></g>${label(270,303,'reference wire')}${label(472,302,'test wire')}${label(350,193,'spirit level')}${label(345,293,'vernier scale')}${label(637,155,'micrometer')}`);
};

renderP10Scene=function(){
  const v=getVals(),t=simT*speed,[I,Lcm,B]=v,F=B*I*(Lcm/100),targetMass=F/9.81*1000;
  const ramp=running?Math.min(1,1-Math.exp(-Math.max(0,t)*5)):0;
  const mass=targetMass*ramp,defl=Math.min(10,F/0.003)*ramp;
  return sceneBase(`${psu(100,125)}${meter(260,125,'A',(I*ramp).toFixed(2))}<g data-part="Variable resistor" filter="url(#shadow)"><rect x="390" y="142" width="116" height="58" rx="8" fill="#303937" stroke="#171d1b" stroke-width="3"/><rect x="408" y="163" width="80" height="12" rx="5" fill="#bbb3a5"/><line x1="${405+Math.min(1,I/5)*82}" y1="141" x2="${405+Math.min(1,I/5)*82}" y2="190" stroke="#d3eca6" stroke-width="4"/></g><g data-part="Magnet assembly" transform="translate(0 ${defl})" filter="url(#shadow)"><path d="M566 160 h105 v152 h-105z" fill="#343d3b" stroke="#151b19" stroke-width="4"/><rect x="584" y="180" width="68" height="42" rx="6" fill="#b94e45"/><rect x="584" y="248" width="68" height="42" rx="6" fill="#465db0"/><rect x="608" y="220" width="20" height="31" fill="#eef0e9"/><text x="618" y="202" text-anchor="middle" fill="#fff" font-size="9">N</text><text x="618" y="274" text-anchor="middle" fill="#fff" font-size="9">S</text></g><g data-part="Straight wire"><line x1="478" y1="236" x2="744" y2="236" stroke="#c8604c" stroke-width="6"/><line x1="478" y1="232" x2="744" y2="232" stroke="#f0aa94" stroke-width="1.5"/></g><g data-part="Field direction"><g stroke="#d3eca6" stroke-width="2" opacity=".7">${Array.from({length:4},(_,i)=>`<line x1="${596+i*16}" y1="226" x2="${596+i*16}" y2="244"/><path d="M${592+i*16} 239 l4 6 4-6" fill="none"/>`).join('')}</g></g><g data-part="Top-pan balance" filter="url(#shadow)"><ellipse cx="620" cy="320" rx="88" ry="12" fill="#b8c0bd"/><rect x="525" y="323" width="192" height="58" rx="11" fill="#d8dedb" stroke="#58645f" stroke-width="3"/><rect x="572" y="339" width="96" height="26" rx="3" class="meter-screen"/><text x="620" y="357" text-anchor="middle" font-size="12" font-family="monospace">${mass.toFixed(3)} g</text><circle cx="545" cy="351" r="7" fill="${running?'#b9ed88':'#8a9692'}"/></g>${cable('M235 175 C280 205 330 230 390 170','#c9433b')}${cable('M506 170 C540 195 555 215 585 236','#202626')}${label(554,146,'magnet assembly')}${label(517,307,'top-pan balance')}${label(384,128,'variable resistor')}${label(476,219,'current-carrying wire')}`);
};

runExperiment=function(){
  if(current?.id===3){simT=0;running=true;methodStep=Math.min(current.method.length-1,Math.max(methodStep,3));renderCoach();renderScene();beep();return;}
  if(current?.id===4||current?.id===10){simT=0;running=true;methodStep=Math.min(current.method.length-1,Math.max(methodStep,2));renderCoach();renderScene();beep();return;}
  return previousRunExperiment();
};

resetExperiment=function(){
  if(current?.id===3||current?.id===4||current?.id===10){running=false;simT=0;methodStep=0;renderCoach();renderScene();return;}
  return previousResetExperiment();
};
})();