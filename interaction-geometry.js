(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function ratio(i){let m=modeVar(i),v=getVals()[i];return clamp((v-m[2])/(m[3]-m[2]),0,1);}
function translatePart(name,x=0,y=0){let g=document.querySelector(`#scene [data-part="${CSS.escape(name)}"]`);if(g)g.setAttribute('transform',`translate(${x} ${y})`);}
function applyGeometry(){if(!current)return;let svg=document.querySelector('#scene svg');if(!svg)return;
 if(current.id===2){let r=ratio(1),desired=610+r*125;translatePart('Screen',desired-676,0);let marker=document.querySelector('#scene [data-part="Distance markers"]');if(marker){let line=marker.querySelector('line');if(line)line.setAttribute('x2',desired+66);}}
 if(current.id===12){let r=ratio(0),desired=390+r*300;translatePart('Virtual source holder',desired-620,0);let axis=[...svg.querySelectorAll('line')].find(l=>l.getAttribute('stroke-dasharray')==='7 8');if(axis)axis.setAttribute('x2',desired);}
 if(current.id===6){let g=document.querySelector('#scene [data-part="Variable resistor"]');if(g){let x=370+ratio(0)*105;let slider=[...g.querySelectorAll('line')].find(l=>+l.getAttribute('y1')===142||+l.getAttribute('y1')===145);if(slider){slider.setAttribute('x1',x);slider.setAttribute('x2',x);}}}
 if(current.id===10){let g=document.querySelector('#scene [data-part="Variable resistor"]');if(g){let x=405+ratio(0)*82;let slider=[...g.querySelectorAll('line')].find(l=>+l.getAttribute('y1')===141||+l.getAttribute('y1')===142);if(slider){slider.setAttribute('x1',x);slider.setAttribute('x2',x);}}}
 if(current.id===1){let r=ratio(1);translatePart('Mass hanger',0,(r-.5)*24);}
 if(current.id===7&&currentMode===1){let r=ratio(0);translatePart('Mass hanger',0,(r-.5)*26);}
}
const prev=renderScene;renderScene=function(){prev();applyGeometry();};
setTimeout(applyGeometry,0);
})();