(()=>{
const prevTheoretical=theoretical;
const prevRenderData=renderData;
const prevRecord=record;
const prevRunExperiment=runExperiment;

function axisMeta(){
  if(!current)return null;
  if(current.id===7)return currentMode===0?['pendulum length / m','period² / s²']:['oscillating mass / kg','period² / s²'];
  if(current.id===8)return currentMode===0?['1 / volume / mL⁻¹','pressure / kPa']:['temperature / K','air-column length / cm'];
  if(current.id===9)return currentMode===0?['time / s','ln(V / V)']:['time / s','ln((V₀−V) / V)'];
  if(current.id===10)return [currentMode===0?'current / A':currentMode===1?'active length / m':'flux density / T','force / mN'];
  if(current.id===11)return ['cos(angle)','induced emf amplitude / V'];
  if(current.id===12)return ['1 / distance² / cm⁻²','background-corrected count rate / min⁻¹'];
  return null;
}

function p6Theory(vals=getVals()){
  const [R,e,r]=vals,I=e/(R+r),V=e-I*r;
  return {x:I,y:V,read:running?{Current:`${I.toFixed(3)} A`,Terminal:`${V.toFixed(3)} V`,EMF:`${e.toFixed(2)} V`,Switch:'closed'}:{Current:'0.000 A',Terminal:`${e.toFixed(3)} V`,EMF:`${e.toFixed(2)} V`,Switch:'open'}};
}
function p7Theory(vals=getVals()){
  if(currentMode===0){const [L,n,a]=vals,T=2*Math.PI*Math.sqrt(L/9.81);return{x:L,y:T*T,read:{Period:`${T.toFixed(3)} s`,Cycles:`${Math.round(n)}`,Total:`${(T*n).toFixed(2)} s`,Amplitude:`${a.toFixed(0)}°`}};}
  const [m,n,a]=vals,k=8,T=2*Math.PI*Math.sqrt(m/k);return{x:m,y:T*T,read:{Period:`${T.toFixed(3)} s`,Mass:`${m.toFixed(2)} kg`,Cycles:`${Math.round(n)}`,k:`${k.toFixed(1)} N m⁻¹`}};
}
function p8Theory(vals=getVals()){
  if(currentMode===0){const [load,V0,patm]=vals,area=.00032,p=patm+(load/1000*9.81/area)/1000,V=patm*V0/p;return{x:1/V,y:p,read:{Pressure:`${p.toFixed(1)} kPa`,Volume:`${V.toFixed(2)} mL`,Load:`${load.toFixed(0)} g`,pV:`${(p*V).toFixed(1)} kPa·mL`}};}
  const [temp,l0,patm]=vals,T=temp+273.15,L=l0*T/293.15;return{x:T,y:L,read:{Temperature:`${temp.toFixed(0)} °C`,Kelvin:`${T.toFixed(1)} K`,AirLength:`${L.toFixed(2)} cm`,Pressure:`${patm.toFixed(1)} kPa`}};
}
function p9Theory(vals=getVals()){
  const [Rk,Cu,V0]=vals,tau=Rk*1000*Cu*1e-6,t=Math.max(0,Math.min(simT,5*tau));
  const V=currentMode===0?V0*Math.exp(-t/tau):V0*(1-Math.exp(-t/tau));
  const linearSignal=currentMode===0?Math.max(V,1e-9):Math.max(V0-V,1e-9),ln=Math.log(linearSignal);
  return{x:t,y:ln,read:{Voltage:`${V.toFixed(2)} V`,Time:`${t.toFixed(2)} s`,Tau:`${tau.toFixed(2)} s`,'ln term':ln.toFixed(3)}};
}
function p10Theory(vals=getVals()){
  const [I,Lcm,B]=vals,F=B*I*(Lcm/100),x=currentMode===0?I:currentMode===1?Lcm/100:B,massg=F/9.81*1000;
  return{x,y:F*1000,read:{Force:`${(F*1000).toFixed(2)} mN`,Balance:running?`${massg.toFixed(3)} g`:'0.000 g',Current:`${I.toFixed(2)} A`,Field:`${B.toFixed(2)} T`}};
}
function p11Theory(vals=getVals()){
  const [ang,amp,f]=vals,c=Math.cos(ang*Math.PI/180),emf=amp*(f/50)*c;
  return{x:c,y:emf,read:{Angle:`${ang.toFixed(0)}°`,cosθ:c.toFixed(3),EMF:`${emf.toFixed(3)} V`,Frequency:`${f.toFixed(0)} Hz`}};
}
function p12Theory(vals=getVals()){
  const [r,t,bg]=vals,source=5000/(r*r),total=source+bg,expected=total*t/60,sigma=Math.sqrt(Math.max(expected,1))/(t/60);
  return{x:1/(r*r),y:source,read:{Distance:`${r.toFixed(0)} cm`,Expected:`${expected.toFixed(1)} counts`,Corrected:`${source.toFixed(1)} min⁻¹`,Uncertainty:`±${sigma.toFixed(1)} min⁻¹`}};
}

theoretical=function(vals=getVals()){
  if(current?.id===6)return p6Theory(vals);
  if(current?.id===7)return p7Theory(vals);
  if(current?.id===8)return p8Theory(vals);
  if(current?.id===9)return p9Theory(vals);
  if(current?.id===10)return p10Theory(vals);
  if(current?.id===11)return p11Theory(vals);
  if(current?.id===12)return p12Theory(vals);
  return prevTheoretical(vals);
};

renderData=function(){
  const m=axisMeta();if(!m)return prevRenderData();
  const ox=current.x,oy=current.y;current.x=m[0];current.y=m[1];
  try{return prevRenderData();}finally{current.x=ox;current.y=oy;}
};

renderP7Scene=function(){
  const v=getVals(),t=simT*speed,th=p7Theory(v),T=parseFloat(th.read.Period);
  if(currentMode===0){
    const Lm=v[0],ampDeg=v[2],ang=(running?Math.sin(2*Math.PI*t/T):0)*ampDeg,rad=ang*Math.PI/180,Lpx=125+Lm*95,x=350+Math.sin(rad)*Lpx,y=88+Math.cos(rad)*Lpx;
    return sceneBase(`${stand(250,250,190)}<g data-part="Pendulum"><line x1="350" y1="88" x2="${x}" y2="${y}" stroke="#e8eee9" stroke-width="2"/><circle cx="${x}" cy="${y}" r="18" fill="url(#metal)" stroke="#4b5754" stroke-width="2"/></g>${ruler(278,70,240,12,true)}<g data-part="Fiducial marker"><line x1="350" y1="250" x2="350" y2="325" stroke="#d3eca6" stroke-width="3"/><circle cx="350" cy="250" r="5" fill="#d3eca6"/></g><g data-part="Timer" filter="url(#shadow)"><rect x="560" y="180" width="110" height="70" rx="8" fill="url(#orange)"/><rect x="582" y="195" width="66" height="25" class="meter-screen"/><text x="615" y="212" text-anchor="middle" font-family="monospace" font-size="10">T ${T.toFixed(3)} s</text></g>${label(314,69,'pivot')}${label(270,330,'metre rule')}${label(330,345,'fiducial')}${label(548,166,'timer')}`);
  }
  const m=v[0],A=v[2],dy=running?A*3*Math.sin(2*Math.PI*t/T):0;
  return sceneBase(`${stand(250,250,190)}<g data-part="Spring"><path d="M350 90 ${Array.from({length:18},(_,i)=>`L${350+(i%2?18:-18)} ${100+i*8+dy*.18}`).join(' ')} L350 ${250+dy}" stroke="#d4ddd9" stroke-width="3" fill="none"/></g><g data-part="Mass hanger" filter="url(#shadow)"><rect x="320" y="${250+dy}" width="60" height="45" rx="5" fill="#666"/><rect x="312" y="${295+dy}" width="76" height="8" fill="#8a9290"/><text x="350" y="${278+dy}" text-anchor="middle" fill="#eee" font-size="8">${m.toFixed(2)} kg</text></g>${ruler(410,80,245,12,true)}<g data-part="Fiducial marker"><line x1="394" y1="250" x2="438" y2="250" stroke="#d3eca6" stroke-width="2"/></g><g data-part="Timer" filter="url(#shadow)"><rect x="560" y="180" width="110" height="70" rx="8" fill="url(#orange)"/><rect x="582" y="195" width="66" height="25" class="meter-screen"/><text x="615" y="212" text-anchor="middle" font-family="monospace" font-size="10">T ${T.toFixed(3)} s</text></g>${label(314,76,'spring')}${label(306,330,'mass')}${label(430,80,'ruler')}`);
};

renderP8Scene=function(){
  const v=getVals(),th=p8Theory(v);
  if(currentMode===0){
    const load=v[0],V0=v[1],V=parseFloat(th.read.Volume),compression=Math.max(0,Math.min(1,1-V/V0)),pistonY=164+compression*105;
    return sceneBase(`<g data-part="Gas syringe" filter="url(#shadow)"><rect x="275" y="145" width="120" height="185" rx="22" fill="#e8f0ec" opacity=".72" stroke="#677a75" stroke-width="5"/><rect x="288" y="${pistonY}" width="94" height="22" rx="8" fill="#222"/><rect x="325" y="${pistonY-72}" width="20" height="75" fill="#858f8c"/><rect x="288" y="${pistonY+22}" width="94" height="${Math.max(8,306-pistonY)}" fill="#a9dce7" opacity=".35"/>${Array.from({length:Math.round(load/100)},(_,i)=>`<rect x="300" y="${pistonY-82-i*10}" width="70" height="9" rx="2" fill="#6d7371"/>`).join('')}<g data-part="Scale">${Array.from({length:8},(_,i)=>`<line x1="275" y1="${185+i*16}" x2="292" y2="${185+i*16}" stroke="#485652"/>`).join('')}</g></g><g data-part="Micrometer"><path d="M540 175 q55-48 86 0 v48 q-35 45-86 0z" fill="none" stroke="url(#metal)" stroke-width="12"/><rect x="582" y="193" width="82" height="22" fill="#777"/></g><g pointer-events="none"><rect x="430" y="275" width="150" height="44" rx="8" fill="#14293c" opacity=".9"/><text x="505" y="292" text-anchor="middle" fill="#8faab4" font-size="8">TRAPPED GAS</text><text x="505" y="310" text-anchor="middle" fill="#d8efbf" font-family="monospace" font-size="12">${V.toFixed(2)} mL · ${th.read.Pressure}</text></g>${label(258,137,'gas syringe')}${label(520,158,'micrometer')}`);
  }
  const temp=v[0],airLen=parseFloat(th.read.AirLength),scale=24,top=318-airLen*scale;
  return sceneBase(`<g data-part="Water bath"><rect x="250" y="145" width="300" height="190" rx="12" fill="#d9eced" opacity=".7" stroke="#667a78" stroke-width="5"/><rect x="260" y="215" width="280" height="110" fill="#78b6c6" opacity=".45"/>${running?'<path d="M275 260 q25-12 50 0t50 0t50 0t50 0" fill="none" stroke="#d8f2f4" stroke-width="3" opacity=".7"/>':''}</g><g data-part="Capillary tube"><rect x="355" y="118" width="24" height="222" rx="9" fill="#e9f6f4" stroke="#657874" stroke-width="3"/><rect x="360" y="${top}" width="14" height="${318-top}" fill="#c9e6ef" opacity=".7"/><circle cx="367" cy="${top}" r="8" fill="#924e55"/></g>${ruler(392,120,220,12,true)}<g data-part="Thermometer"><rect x="480" y="130" width="10" height="180" rx="5" fill="#f4f4ec" stroke="#555"/><rect x="483" y="${300-temp*1.3}" width="4" height="${temp*1.3}" fill="#ce554d"/></g>${label(232,130,'water bath')}${label(335,105,'capillary')}${label(470,115,'thermometer')}`);
};

renderP11Scene=function(){
  const v=getVals(),t=simT*speed,ang=v[0],f=v[2],emf=parseFloat(p11Theory(v).read.EMF),phase=t*2*Math.PI*Math.min(2.5,f/20),fieldPulse=.45+.35*Math.sin(phase);
  const wave=Array.from({length:90},(_,i)=>`${650+i*2.2},${210-45*emf*Math.sin(i/9+phase)}`).join(' ');
  return sceneBase(`${psu(90,140)}<g data-part="Large circular coil"><circle cx="430" cy="215" r="110" fill="none" stroke="#252f2d" stroke-width="20"/><circle cx="430" cy="215" r="88" fill="none" stroke="#b96a41" stroke-width="5"/><g stroke="#d3eca6" opacity="${fieldPulse}">${[-50,-25,0,25,50].map(d=>`<line x1="${365}" y1="${215+d}" x2="${495}" y2="${215+d}" stroke-width="2"/>`).join('')}</g></g><g data-part="Search coil" transform="rotate(${ang} 430 215)"><ellipse cx="430" cy="215" rx="38" ry="92" fill="none" stroke="#d3eca6" stroke-width="8"/><line x1="430" y1="123" x2="430" y2="307" stroke="#d3eca6" stroke-width="2"/></g><g data-part="Protractor"><path d="M360 320 A70 70 0 0 1 500 320" fill="none" stroke="#e5d6a0" stroke-width="8"/><line x1="430" y1="320" x2="${430+65*Math.sin(ang*Math.PI/180)}" y2="${320-65*Math.cos(ang*Math.PI/180)}" stroke="#e5d6a0" stroke-width="3"/></g><g data-part="Oscilloscope"><rect x="650" y="132" width="220" height="160" rx="12" fill="#39413e" stroke="#181d1b" stroke-width="4"/><rect x="670" y="155" width="176" height="105" rx="6" fill="#17322b"/><polyline points="${wave}" fill="none" stroke="#9bea8a" stroke-width="2"/></g>${label(370,86,'large field coil')}${label(382,205,'search coil')}${label(648,115,'oscilloscope')}`);
};

function hash01(n){const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);}
renderP12Scene=function(){
  const v=getVals(),t=simT*speed,th=p12Theory(v),r=v[0],rate=5000/(r*r)+v[2],bucket=Math.floor(t*12),p=Math.min(.7,rate/120),pulse=running&&hash01(bucket)<p;
  return sceneBase(`<g data-part="Virtual GM tube"><rect x="190" y="178" width="140" height="58" rx="25" fill="#384744" stroke="#202b29" stroke-width="4"/><rect x="305" y="188" width="38" height="38" rx="6" fill="#6a7c76"/>${pulse?'<circle cx="260" cy="207" r="18" fill="#d3eca6" opacity=".75"/>':''}</g><g data-part="Virtual scaler"><rect x="115" y="285" width="210" height="80" rx="10" fill="#d8c69d" stroke="#564d3b" stroke-width="3"/><rect x="160" y="300" width="118" height="27" rx="3" fill="#202d28"/><text x="219" y="319" text-anchor="middle" fill="#d3eca6" font-family="monospace">${th.read.Expected}</text></g><g data-part="Virtual source holder"><rect x="620" y="190" width="75" height="65" rx="8" fill="#7a5b3c"/><rect x="638" y="175" width="39" height="24" rx="6" fill="#5c4936"/></g><g data-part="Distance scale">${ruler(330,266,365,10,false)}</g><line x1="343" y1="207" x2="620" y2="207" stroke="#c6d2ce" stroke-dasharray="7 8"/>${label(180,160,'virtual GM tube')}${label(108,274,'virtual scaler')}${label(600,161,'virtual source holder')}${label(350,300,'distance scale')}`);
};

function poisson(lambda){
  if(lambda<=0)return 0;
  if(lambda<40){let L=Math.exp(-lambda),k=0,p=1;do{k++;p*=Math.random();}while(p>L);return k-1;}
  const u1=Math.max(1e-12,Math.random()),u2=Math.random(),z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
  return Math.max(0,Math.round(lambda+Math.sqrt(lambda)*z));
}
record=function(repeats=1){
  if(current?.id!==12)return prevRecord(repeats);
  const [r,seconds,bg]=getVals(),source=5000/(r*r),duration=seconds/60;
  for(let i=0;i<repeats;i++){
    const counts=poisson((source+bg)*duration),measured=Math.max(0,counts/duration-bg);
    getData().push({x:1/(r*r),y:measured,rep:i+1,counts});
  }
  save();renderData();beep();
};

runExperiment=function(){
  if(current?.id===9&&simT>=5*(getVals()[0]*1000*getVals()[1]*1e-6))simT=0;
  return prevRunExperiment();
};
})();