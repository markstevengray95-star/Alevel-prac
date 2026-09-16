(()=>{
renderP9Scene=function(){
  const v=getVals(),t=simT*speed,th=theoretical(),V=Math.max(0,parseFloat(th.read.Voltage)||0),frac=Math.max(0,Math.min(1,V/v[2])),closed=running;
  const levelH=Math.max(3,frac*58),levelY=300-levelH;
  const chargeDots=running?Array.from({length:6},(_,i)=>{let x=250+((t*70+i*80)%400);return `<circle cx="${x}" cy="184" r="4" fill="#d3eca6" filter="url(#screenGlow)"/>`}).join(''):'';
  return sceneBase(`${psu(105,130)}<g data-part="Resistor" filter="url(#shadow)"><rect x="350" y="158" width="126" height="48" rx="9" fill="#d6c4a0" stroke="#65594a" stroke-width="3"/><path d="M370 182 l12-11 12 22 12-22 12 22 12-22 12 11" fill="none" stroke="#473d34" stroke-width="3"/><text x="413" y="199" text-anchor="middle" font-size="7" fill="#665745">${v[0].toFixed(1)} kΩ</text></g><g data-part="Capacitor" filter="url(#shadow)"><line x1="556" y1="153" x2="556" y2="221" stroke="#353b39" stroke-width="7"/><line x1="586" y1="153" x2="586" y2="221" stroke="#353b39" stroke-width="7"/><rect x="541" y="232" width="60" height="78" rx="10" fill="#2d3633" stroke="#111715" stroke-width="3"/><rect x="550" y="${levelY}" width="42" height="${levelH}" rx="4" fill="#d3eca6" opacity=".78"/><text x="571" y="296" text-anchor="middle" font-size="7" fill="#dce4e0">${v[1].toFixed(0)} µF</text></g>${meter(690,128,'V',V.toFixed(2))}<g data-part="Two-position switch" filter="url(#softShadow)"><rect x="260" y="266" width="105" height="65" rx="9" fill="#d9dedb" stroke="#606b67" stroke-width="2"/><circle cx="278" cy="298" r="6" fill="#333"/><circle cx="345" cy="282" r="6" fill="#333"/><circle cx="345" cy="315" r="6" fill="#333"/><line x1="278" y1="298" x2="${closed?345:332}" y2="${currentMode===0?315:282}" stroke="url(#metal)" stroke-width="6" stroke-linecap="round"/></g>${cable('M235 181 C285 150 320 175 350 182','#c9433b')}${cable('M476 182 C510 182 532 182 556 182','#202626')}${cable('M586 182 C632 178 660 165 690 182','#c9433b')}${cable('M732 240 C690 330 440 350 345 315','#202626')}${chargeDots}<g data-part="Timing indicator"><circle cx="622" cy="285" r="22" fill="#202a27" stroke="#697570"/><path d="M622 285 l0-14 M622 285 l10 6" stroke="#d3eca6" stroke-width="2"/></g><g pointer-events="none"><rect x="490" y="102" width="155" height="42" rx="8" fill="#14293c" opacity=".9"/><text x="568" y="119" text-anchor="middle" fill="#8faab4" font-size="8">${currentMode===0?'DISCHARGING':'CHARGING'}</text><text x="568" y="136" text-anchor="middle" fill="#d8efbf" font-family="monospace" font-size="10">${V.toFixed(2)} V · τ ${th.read.Tau}</text></g>${label(342,145,'resistor')}${label(530,137,'capacitor')}${label(258,251,'two-position switch')}${label(684,114,'voltmeter')}`);
};
})();

(()=>{
  const previousRecord=record;
  record=function(repeats=1){
    const point=theoretical();
    if(!Number.isFinite(point.x)||!Number.isFinite(point.y)){
      alert('This setting cannot produce a valid graph point. Adjust the controls and try again.');
      return;
    }
    return previousRecord(repeats);
  };
})();
