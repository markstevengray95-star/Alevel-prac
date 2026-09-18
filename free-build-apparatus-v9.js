(()=>{
'use strict';
if(window.__freeBuildApparatusV9Ready)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function key(id){return (current?.id||0)+':'+id;}
function kind(id,name=''){
  const k=key(id);
  const exact={
    '1:gen':'signal-generator','1:vib':'vibration-generator','1:string':'string','1:pulley':'pulley','1:mass':'mass-hanger','1:rule':'metre-rule',
    '2:light':'laser','2:slits':'double-slit','2:grating':'diffraction-grating','2:screen':'optical-screen','2:rule':'metre-rule','2:caliper':'vernier-calipers',
    '3:release':'release-mechanism','3:ball':'ball-bearing','3:plumb':'plumb-line','3:detector':'light-gate','3:timer':'data-logger','3:rule':'metre-rule',
    '4:support':'retort-stand','4:ref':'reference-wire','4:test':'test-wire','4:masses':'mass-hanger','4:vernier':'spirit-vernier','4:micro':'micrometer',
    '5:psu':'dc-supply','5:amm':'ammeter','5:wire':'resistance-wire','5:slide':'sliding-contact','5:volt':'voltmeter','5:rule':'metre-rule','5:micro':'micrometer','5:switch':'switch',
    '6:cell':'cell','6:amm':'ammeter','6:var':'variable-resistor','6:switch':'switch','6:volt':'voltmeter',
    '7:clamp':'retort-stand','7:pend':'pendulum','7:fid':'fiducial','7:spring':'spring','7:mass':'mass-hanger','7:timer':'timer','7:rule':'metre-rule',
    '8:syringe':'gas-syringe','8:seal':'plunger','8:masses':'mass-hanger','8:micro':'micrometer','8:cap':'capillary','8:bath':'water-bath','8:therm':'thermometer','8:rule':'metre-rule',
    '9:source':'dc-supply','9:switch':'changeover-switch','9:cap':'capacitor','9:res':'resistor','9:volt':'voltmeter',
    '10:balance':'top-pan-balance','10:magnet':'magnet-pair','10:wire':'straight-wire','10:psu':'dc-supply','10:amm':'ammeter','10:var':'variable-resistor','10:rule':'metre-rule',
    '11:field':'field-coil','11:search':'search-coil','11:pro':'protractor','11:scope':'oscilloscope','11:gen':'signal-generator',
    '12:holder':'source-holder','12:gm':'gm-tube','12:scaler':'scaler','12:rule':'distance-scale','12:screen':'shield-screen'
  };
  if(exact[k])return exact[k];
  const n=name.toLowerCase();
  if(/ammeter/.test(n))return'ammeter';if(/voltmeter/.test(n))return'voltmeter';if(/micrometer/.test(n))return'micrometer';
  if(/ruler|rule|scale/.test(n))return'metre-rule';if(/timer|logger/.test(n))return'data-logger';if(/screen/.test(n))return'optical-screen';
  return'generic';
}
const shell=(kind,body,label)=>`<svg class="fb-apparatus-svg fb-kind-${kind}" data-apparatus-kind="${kind}" viewBox="0 0 120 76" role="img" aria-label="${esc(label)}"><ellipse class="fb-shadow" cx="60" cy="68" rx="42" ry="5"/>${body}</svg>`;
function meter(letter,cls='meter'){
  return `<rect class="case" x="20" y="18" width="80" height="44" rx="7"/><rect class="glass" x="30" y="25" width="60" height="22" rx="3"/><path class="scale" d="M38 43 Q60 23 82 43"/><line class="needle" x1="60" y1="43" x2="72" y2="31"/><text class="mark" x="60" y="40" text-anchor="middle">${letter}</text><circle class="red" cx="37" cy="57" r="4"/><circle class="black" cx="83" cy="57" r="4"/>`;
}
function render(id,name=''){
  const k=kind(id,name);let b='';
  switch(k){
    case'signal-generator':b=`<rect class="case" x="18" y="18" width="84" height="44" rx="6"/><rect class="screen" x="27" y="26" width="35" height="19" rx="2"/><path class="trace" d="M30 36 q5 -8 10 0 t10 0 t10 0"/><circle class="knob" cx="76" cy="34" r="8"/><circle class="knob small" cx="91" cy="51" r="5"/><circle class="red" cx="28" cy="55" r="4"/><circle class="black" cx="40" cy="55" r="4"/>`;break;
    case'vibration-generator':b=`<rect class="metal" x="24" y="36" width="72" height="25" rx="5"/><rect class="dark" x="34" y="25" width="52" height="19" rx="4"/><line class="rod" x1="60" y1="24" x2="60" y2="11"/><circle class="cap" cx="60" cy="10" r="4"/><path class="motion" d="M44 15 q5 -5 10 0 m12 0 q5 -5 10 0"/>`;break;
    case'string':b=`<line class="string" x1="12" y1="39" x2="108" y2="39"/><path class="wave" d="M14 39 Q26 20 38 39 T62 39 T86 39 T108 39"/><circle class="fixture" cx="13" cy="39" r="4"/><circle class="fixture" cx="107" cy="39" r="4"/>`;break;
    case'pulley':b=`<path class="stand" d="M42 63V20H67"/><circle class="wheel" cx="76" cy="25" r="15"/><circle class="hub" cx="76" cy="25" r="4"/><path class="cord" d="M14 25H76 A15 15 0 0 1 91 40V64"/>`;break;
    case'mass-hanger':b=`<line class="wire" x1="60" y1="9" x2="60" y2="23"/><path class="hanger" d="M46 23H74L69 33H51Z"/><rect class="mass" x="43" y="36" width="34" height="10" rx="2"/><rect class="mass" x="40" y="48" width="40" height="10" rx="2"/><rect class="mass" x="36" y="60" width="48" height="7" rx="2"/>`;break;
    case'metre-rule':case'distance-scale':b=`<rect class="wood" x="8" y="31" width="104" height="18" rx="2"/><g class="ticks">${Array.from({length:21},(_,i)=>`<line x1="${10+i*5}" y1="32" x2="${10+i*5}" y2="${i%5===0?43:39}"/>`).join('')}</g><text class="tiny" x="58" y="47">mm / cm</text>`;break;
    case'laser':b=`<rect class="laser-body" x="25" y="30" width="62" height="22" rx="9"/><rect class="metal" x="15" y="35" width="16" height="12" rx="2"/><circle class="lens" cx="88" cy="41" r="7"/><line class="laser-beam" x1="95" y1="41" x2="115" y2="41"/><rect class="base" x="36" y="53" width="42" height="8" rx="3"/>`;break;
    case'double-slit':b=`<rect class="plate" x="46" y="13" width="28" height="51" rx="2"/><line class="slit" x1="57" y1="22" x2="57" y2="55"/><line class="slit" x1="63" y1="22" x2="63" y2="55"/><rect class="base" x="37" y="64" width="46" height="5"/>`;break;
    case'diffraction-grating':b=`<rect class="glass" x="43" y="12" width="34" height="52" rx="2"/>${Array.from({length:10},(_,i)=>`<line class="grating" x1="${47+i*3}" y1="17" x2="${47+i*3}" y2="59"/>`).join('')}<rect class="base" x="36" y="64" width="48" height="5"/>`;break;
    case'optical-screen':case'shield-screen':b=`<rect class="screen-board" x="34" y="10" width="52" height="48" rx="2"/><line class="stand" x1="60" y1="58" x2="60" y2="67"/><rect class="base" x="39" y="66" width="42" height="5"/>`;break;
    case'vernier-calipers':b=`<rect class="steel" x="13" y="33" width="94" height="8" rx="2"/><path class="steel" d="M24 18h8v30h-8zM32 21h12v7H32zM69 25h8v23h-8zM57 28h20v7H57z"/><g class="fine-ticks">${Array.from({length:12},(_,i)=>`<line x1="${42+i*4}" y1="34" x2="${42+i*4}" y2="${i%5===0?40:38}"/>`).join('')}</g>`;break;
    case'release-mechanism':b=`<path class="stand" d="M35 66V15H72"/><rect class="clamp" x="65" y="12" width="28" height="14" rx="3"/><circle class="ball" cx="82" cy="34" r="7"/><line class="drop-guide" x1="82" y1="42" x2="82" y2="67"/>`;break;
    case'ball-bearing':b=`<circle class="ball-shine" cx="60" cy="38" r="22"/><circle class="shine" cx="51" cy="29" r="6"/>`;break;
    case'plumb-line':b=`<rect class="top" x="48" y="8" width="24" height="8" rx="2"/><line class="cord" x1="60" y1="16" x2="60" y2="55"/><path class="plumb" d="M52 54L60 69L68 54Z"/>`;break;
    case'light-gate':b=`<path class="gate" d="M32 62V20H46V48H74V20H88V62"/><line class="beam" x1="46" y1="36" x2="74" y2="36"/><circle class="led" cx="38" cy="55" r="3"/><rect class="base" x="25" y="61" width="70" height="7" rx="2"/>`;break;
    case'data-logger':case'timer':case'scaler':b=`<rect class="case" x="21" y="18" width="78" height="45" rx="6"/><rect class="digital" x="31" y="27" width="58" height="18" rx="2"/><text class="digits" x="60" y="40" text-anchor="middle">0.000</text><circle class="button" cx="37" cy="54" r="4"/><circle class="button" cx="50" cy="54" r="4"/><circle class="button" cx="63" cy="54" r="4"/>`;break;
    case'retort-stand':b=`<rect class="base" x="18" y="62" width="68" height="7" rx="2"/><line class="stand" x1="34" y1="62" x2="34" y2="10"/><line class="clamp-arm" x1="34" y1="26" x2="83" y2="26"/><path class="clamp" d="M79 19h13v14H79z"/>`;break;
    case'reference-wire':case'test-wire':case'resistance-wire':case'straight-wire':b=`<line class="wire" x1="14" y1="38" x2="106" y2="38"/><circle class="terminal red" cx="14" cy="38" r="5"/><circle class="terminal black" cx="106" cy="38" r="5"/><path class="wire-glow" d="M22 38H98"/>`;break;
    case'spirit-vernier':b=`<rect class="steel" x="15" y="27" width="90" height="22" rx="5"/><rect class="level" x="37" y="31" width="46" height="12" rx="6"/><ellipse class="bubble" cx="60" cy="37" rx="8" ry="4"/><g class="fine-ticks">${Array.from({length:9},(_,i)=>`<line x1="${42+i*4.5}" y1="50" x2="${42+i*4.5}" y2="56"/>`).join('')}</g>`;break;
    case'micrometer':b=`<path class="frame" d="M27 16C10 23 10 55 28 62H45V51H31C23 47 23 31 31 27H46V16Z"/><rect class="anvil" x="43" y="31" width="8" height="16"/><rect class="spindle" x="50" y="35" width="27" height="8"/><rect class="sleeve" x="75" y="29" width="19" height="20"/><rect class="thimble" x="93" y="25" width="16" height="28" rx="3"/><line class="index" x1="75" y1="39" x2="109" y2="39"/>`;break;
    case'dc-supply':b=`<rect class="case" x="18" y="18" width="84" height="44" rx="6"/><rect class="digital" x="29" y="26" width="32" height="15" rx="2"/><text class="digits" x="45" y="37" text-anchor="middle">6.0</text><circle class="knob" cx="78" cy="34" r="8"/><circle class="red" cx="39" cy="54" r="5"/><circle class="black" cx="58" cy="54" r="5"/><text class="tiny" x="80" y="56">DC</text>`;break;
    case'ammeter':b=meter('A');break;case'voltmeter':b=meter('V');break;
    case'sliding-contact':b=`<rect class="rail" x="17" y="43" width="86" height="8" rx="3"/><path class="slider" d="M52 22h16l5 21H47z"/><circle class="knob" cx="60" cy="21" r="7"/><line class="pointer" x1="60" y1="28" x2="60" y2="48"/>`;break;
    case'switch':b=`<rect class="base" x="22" y="47" width="76" height="13" rx="3"/><circle class="terminal red" cx="36" cy="45" r="6"/><circle class="terminal black" cx="84" cy="45" r="6"/><line class="blade" x1="36" y1="42" x2="76" y2="25"/><circle class="pivot" cx="36" cy="42" r="4"/>`;break;
    case'cell':b=`<rect class="battery" x="24" y="25" width="72" height="36" rx="10"/><rect class="metal" x="48" y="19" width="24" height="7" rx="2"/><text class="mark" x="60" y="48" text-anchor="middle">CELL</text><text class="plus" x="83" y="39">+</text><text class="minus" x="31" y="39">−</text>`;break;
    case'variable-resistor':b=`<rect class="ceramic" x="20" y="35" width="80" height="20" rx="8"/><path class="coil" d="M28 45h7l4-7 8 14 8-14 8 14 8-14 8 14 5-7h8"/><line class="slider-arm" x1="60" y1="18" x2="60" y2="39"/><circle class="knob" cx="60" cy="16" r="7"/>`;break;
    case'pendulum':b=`<line class="cord" x1="60" y1="8" x2="68" y2="50"/><circle class="bob" cx="70" cy="58" r="10"/><path class="arc" d="M35 56 Q60 68 85 54"/>`;break;
    case'fiducial':b=`<rect class="base" x="31" y="61" width="58" height="7"/><line class="stand" x1="60" y1="61" x2="60" y2="20"/><path class="marker" d="M48 31H72L60 20Z"/>`;break;
    case'spring':b=`<line class="hook" x1="60" y1="6" x2="60" y2="13"/><path class="spring" d="M60 13 q-16 4 0 8 t0 8 t0 8 t0 8 t0 8 t0 8"/><line class="hook" x1="60" y1="61" x2="60" y2="69"/>`;break;
    case'gas-syringe':b=`<rect class="barrel" x="24" y="24" width="67" height="28" rx="5"/><rect class="plunger" x="76" y="29" width="31" height="18"/><line class="rod" x1="91" y1="38" x2="115" y2="38"/><path class="nozzle" d="M24 32H13V44H24"/><g class="ticks">${Array.from({length:8},(_,i)=>`<line x1="${31+i*6}" y1="25" x2="${31+i*6}" y2="31"/>`).join('')}</g>`;break;
    case'plunger':b=`<rect class="rubber" x="36" y="27" width="26" height="25" rx="3"/><line class="rod" x1="62" y1="39" x2="103" y2="39"/><rect class="handle" x="101" y="27" width="8" height="25" rx="2"/>`;break;
    case'capillary':b=`<rect class="glass" x="52" y="7" width="16" height="60" rx="7"/><rect class="liquid" x="57" y="39" width="6" height="25" rx="3"/><circle class="bubble" cx="60" cy="30" r="5"/><g class="ticks">${Array.from({length:6},(_,i)=>`<line x1="68" y1="${17+i*8}" x2="75" y2="${17+i*8}"/>`).join('')}</g>`;break;
    case'water-bath':b=`<path class="bath" d="M20 24H100L94 62H26Z"/><path class="water" d="M25 36 Q35 31 45 36T65 36T85 36T96 36"/><path class="heat" d="M42 68q-5-6 0-12m18 12q-5-6 0-12m18 12q-5-6 0-12"/>`;break;
    case'thermometer':b=`<rect class="glass" x="52" y="8" width="16" height="48" rx="8"/><circle class="bulb" cx="60" cy="60" r="10"/><rect class="fluid" x="57" y="25" width="6" height="34" rx="3"/><g class="ticks">${Array.from({length:6},(_,i)=>`<line x1="69" y1="${17+i*7}" x2="77" y2="${17+i*7}"/>`).join('')}</g>`;break;
    case'changeover-switch':b=`<rect class="base" x="20" y="50" width="80" height="12" rx="3"/><circle class="terminal" cx="36" cy="45" r="5"/><circle class="terminal" cx="83" cy="31" r="5"/><circle class="terminal" cx="83" cy="50" r="5"/><line class="blade" x1="36" y1="43" x2="76" y2="32"/>`;break;
    case'capacitor':b=`<line class="lead" x1="14" y1="39" x2="50" y2="39"/><line class="plate" x1="50" y1="20" x2="50" y2="58"/><line class="plate" x1="70" y1="20" x2="70" y2="58"/><line class="lead" x1="70" y1="39" x2="106" y2="39"/><path class="field-lines" d="M55 27h10M55 39h10M55 51h10"/>`;break;
    case'resistor':b=`<line class="lead" x1="10" y1="39" x2="30" y2="39"/><rect class="resistor" x="30" y="29" width="60" height="20" rx="8"/><rect class="band one" x="43" y="29" width="5" height="20"/><rect class="band two" x="56" y="29" width="5" height="20"/><rect class="band three" x="70" y="29" width="5" height="20"/><line class="lead" x1="90" y1="39" x2="110" y2="39"/>`;break;
    case'top-pan-balance':b=`<rect class="case" x="26" y="36" width="68" height="28" rx="5"/><ellipse class="pan" cx="60" cy="28" rx="29" ry="7"/><rect class="digital" x="42" y="45" width="36" height="12" rx="2"/><text class="digits" x="60" y="54" text-anchor="middle">0.000</text><circle class="button" cx="85" cy="52" r="4"/>`;break;
    case'magnet-pair':b=`<path class="magnet north" d="M25 18h25v34H38v-20H25z"/><path class="magnet south" d="M95 18H70v34h12v-20h13z"/><text class="mark" x="37" y="29" text-anchor="middle">N</text><text class="mark" x="83" y="29" text-anchor="middle">S</text><g class="field-lines"><path d="M50 27C58 19 62 19 70 27M50 37C58 29 62 29 70 37M50 47C58 39 62 39 70 47"/></g>`;break;
    case'field-coil':b=`<ellipse class="coil" cx="60" cy="38" rx="36" ry="25"/><ellipse class="coil" cx="60" cy="38" rx="30" ry="20"/><ellipse class="coil" cx="60" cy="38" rx="24" ry="15"/><circle class="terminal red" cx="23" cy="61" r="5"/><circle class="terminal black" cx="97" cy="61" r="5"/>`;break;
    case'search-coil':b=`<ellipse class="coil thin" cx="60" cy="38" rx="27" ry="20"/><ellipse class="coil thin" cx="60" cy="38" rx="23" ry="16"/><line class="lead" x1="34" y1="51" x2="18" y2="65"/><line class="lead" x1="86" y1="51" x2="102" y2="65"/>`;break;
    case'protractor':b=`<path class="protractor" d="M18 58A42 42 0 0 1 102 58H18Z"/><line class="baseline" x1="18" y1="58" x2="102" y2="58"/>${Array.from({length:9},(_,i)=>{const a=Math.PI-(i*Math.PI/8),x1=60+36*Math.cos(a),y1=58-36*Math.sin(a),x2=60+42*Math.cos(a),y2=58-42*Math.sin(a);return`<line class="tick" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`}).join('')}`;break;
    case'oscilloscope':b=`<rect class="case" x="15" y="14" width="90" height="50" rx="7"/><rect class="scope-screen" x="23" y="21" width="53" height="34" rx="3"/><path class="scope-trace" d="M27 39 q7-17 14 0t14 0t14 0"/><circle class="knob" cx="90" cy="29" r="6"/><circle class="knob" cx="90" cy="46" r="6"/>`;break;
    case'source-holder':b=`<rect class="base" x="27" y="62" width="66" height="6"/><line class="stand" x1="60" y1="62" x2="60" y2="22"/><rect class="holder" x="44" y="16" width="32" height="14" rx="3"/><circle class="source-disc" cx="60" cy="23" r="7"/>`;break;
    case'gm-tube':b=`<rect class="tube" x="24" y="29" width="72" height="22" rx="11"/><circle class="window" cx="25" cy="40" r="8"/><line class="cable" x1="96" y1="40" x2="111" y2="58"/><rect class="base" x="37" y="54" width="48" height="6" rx="2"/>`;break;
    default:b=`<rect class="case generic" x="26" y="20" width="68" height="42" rx="7"/><text class="mark" x="60" y="45" text-anchor="middle">APP</text>`;
  }
  return shell(k,b,name);
}
window.__freeBuildApparatusV9={version:'9.0',kind,render};
window.__freeBuildApparatusV9Ready=true;
})();