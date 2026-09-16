/* AQA RP2 part 1: screen intensity follows the two-slit interference and
   finite single-slit diffraction envelope. The fringe axis is magnified. */
(()=>{
'use strict';
const slitWidth=0.05e-3; // illustrative 0.05 mm opening in each slit
function intensityAt(mm,wavelengthNm,distanceM,separationMm){
  const lambda=wavelengthNm*1e-9,x=mm*1e-3,sinTheta=x/Math.hypot(distanceM,x);
  const alpha=Math.PI*(separationMm*1e-3)*sinTheta/lambda;
  const beta=Math.PI*slitWidth*sinTheta/lambda;
  const envelope=Math.abs(beta)<1e-10?1:(Math.sin(beta)/beta)**2;
  return Math.cos(alpha)**2*envelope;
}
window.p2DoubleSlitIntensity=intensityAt;
function visibleHue(nm){if(nm<490)return 240-(nm-450)*1.5;if(nm<560)return 180-(nm-490)*1.2;if(nm<620)return 96-(nm-560)*1.43;return Math.max(0,10-(nm-620)/3);}
renderP2Scene=function(){
  const [wavelength,D,spacingMm]=getVals(),lambda=wavelength*1e-9;
  const colour=`hsl(${Math.round(visibleHue(wavelength))} 100% 62%)`;
  const beamOpacity=0.55; // steady monochromatic illumination; the pattern does not pulse
  let pattern='',measurement='',fringeMm=0;
  if(currentMode===0){
    fringeMm=lambda*D/(spacingMm*1e-3)*1000;
    const pxPerMm=107/24; // fixed 24 mm central field; no clipped fringe spacing
    pattern=Array.from({length:107},(_,i)=>{
      const mm=(i-53)/pxPerMm,I=intensityAt(mm,wavelength,D,spacingMm);
      return `<rect x="${690+i}" y="103" width="1.02" height="145" fill="${colour}" opacity="${(0.055+0.91*Math.pow(I,0.68)).toFixed(3)}"/>`;
    }).join('');
    const x1=743-2.5*fringeMm*pxPerMm,x2=743+2.5*fringeMm*pxPerMm;
    measurement=x1>=691&&x2<=796?`<g data-part="Five-fringe measurement" pointer-events="none"><line x1="${x1.toFixed(2)}" y1="113" x2="${x2.toFixed(2)}" y2="113" stroke="#e9f3ed" stroke-width="1.2"/><path d="M${x1.toFixed(2)} 107v12 M${x2.toFixed(2)} 107v12" stroke="#e9f3ed" stroke-width="1.2"/><text x="743" y="96" text-anchor="middle" font-size="8" fill="#21362e">5w = ${(5*fringeMm).toFixed(1)} mm</text></g>`:'';
  }else{
    const d=spacingMm*1e-3,maxN=Math.min(5,Math.floor(d/lambda));
    pattern=Array.from({length:maxN*2+1},(_,j)=>{const n=j-maxN,s=n*lambda/d;if(Math.abs(s)>=1)return '';const theta=Math.asin(s),x=743+Math.tan(theta)*D*40;if(x<691||x>796)return '';return `<rect x="${(x-2).toFixed(2)}" y="110" width="${n===0?6:4}" height="132" rx="2" fill="${colour}" opacity="${n===0?1:.82}" filter="url(#screenGlow)"/>`;}).join('');
  }
  const element=currentMode===0?'Double slit':'Diffraction grating';
  const phase=running?(simT*speed*55)%26:0;
  const screenEdge=610+(Math.max(0,Math.min(1,(D-.5)/2))*125);
  const wavefrontCue=`<g data-part="Propagation cue" pointer-events="none"><line x1="351" y1="207" x2="${(screenEdge-2).toFixed(2)}" y2="207" stroke="${colour}" stroke-width="1.7" stroke-dasharray="5 21" stroke-dashoffset="${(-phase).toFixed(2)}" opacity=".55"/></g>`;
  const inset=currentMode===0?`<g data-part="Slit face detail" pointer-events="none"><rect x="427" y="43" width="132" height="91" rx="7" fill="#e8f0ec" stroke="#6f857c"/><text x="493" y="58" text-anchor="middle" font-size="8" fill="#29423a">SLIT FACE · MAGNIFIED</text><rect x="455" y="64" width="75" height="45" rx="2" fill="#273633"/><path d="M481 68v37 M503 68v37" stroke="#e9f4ec" stroke-width="3"/><path d="M481 118h22 M481 114v8 M503 114v8" stroke="#40574f"/><text x="493" y="131" text-anchor="middle" font-size="8" fill="#29423a">s = ${spacingMm.toFixed(2)} mm</text></g>`:'';
  return sceneBase(`${stand(146,250,155)}<g data-part="Laser / monochromatic source" filter="url(#shadow)"><rect x="105" y="188" width="104" height="38" rx="8" fill="#273b43" stroke="#162126" stroke-width="3"/><circle cx="204" cy="207" r="8" fill="${colour}" filter="url(#screenGlow)"/><line x1="212" y1="207" x2="333" y2="207" stroke="${colour}" stroke-width="2.6" opacity="${beamOpacity}"/></g><g data-part="${element}" filter="url(#shadow)"><rect x="330" y="150" width="20" height="114" rx="3" fill="#303d3b" stroke="#171e1d" stroke-width="2"/>${currentMode===0?'<path d="M340 178v18 M340 217v18" stroke="#eef5f1" stroke-width="2"/>':'<g stroke="#e8eee9">'+Array.from({length:15},(_,i)=>`<line x1="${333+i}" y1="159" x2="${333+i}" y2="255" stroke-width=".8"/>`).join('')+'</g>'}</g><g data-part="Screen" data-fringe-mm="${fringeMm.toFixed(4)}" filter="url(#shadow)"><rect x="676" y="90" width="135" height="170" rx="5" fill="#ecebe2" stroke="#666f6b" stroke-width="4"/><rect x="690" y="102" width="107" height="146" fill="#151918"/>${pattern}${measurement}<text x="743" y="277" text-anchor="middle" font-size="8" fill="#253b34">${currentMode===0?'central 24 mm enlarged':'grating maxima'}</text></g>${wavefrontCue}${inset}${ruler(340,274,402,9,false)}<g data-part="Distance markers"><line x1="340" y1="299" x2="743" y2="299" stroke="#42504d" stroke-width="2"/><path d="M340 293v12M743 293v12" stroke="#42504d" stroke-width="2"/><text x="541" y="317" text-anchor="middle" font-size="10" fill="#263b35">D = ${D.toFixed(2)} m · slit plane → screen</text></g>${label(95,174,'light source')}${label(300,139,currentMode===0?'double slit':'grating')}${label(703,78,'screen')}`);
};
})();
