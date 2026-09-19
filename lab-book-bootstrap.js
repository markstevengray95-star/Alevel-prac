(()=>{
'use strict';
const REV='20260919-interactive-3d-v11';
const versioned=src=>`${src}?v=${REV}`;
function loadStyle(href,key){if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l);}
function addLabView(){
  const main=document.querySelector('main');if(!main)return;
  if(!document.querySelector('#view-labbook')){
    const section=document.createElement('section');section.id='view-labbook';section.className='view';section.innerHTML=`<div class="page-heading"><span class="eyebrow">AQA PRACTICAL RECORD</span><h1>Lab book</h1><p>Record what you actually did, measured, processed and concluded for each required practical.</p></div><div id="labBookRoot"></div>`;main.appendChild(section);
  }
  const nav=document.querySelector('.lab-header nav');
  if(nav&&!nav.querySelector('[data-view="labbook"]')){const b=document.createElement('button');b.dataset.view='labbook';b.textContent='Lab book';b.onclick=()=>navigate('labbook');nav.insertBefore(b,nav.querySelector('[data-view="skills"]'));}
  const hero=document.querySelector('#view-home .hero-copy');
  if(hero&&!hero.querySelector('#openLabBookHome')){const b=document.createElement('button');b.id='openLabBookHome';b.className='secondary-btn';b.textContent='Open my lab book →';b.onclick=()=>navigate('labbook');hero.insertBefore(b,hero.querySelector('.hero-note'));}
}
function loadScript(src,key){return new Promise(resolve=>{const found=document.querySelector(`script[data-${key}]`);if(found){if(found.dataset.loaded==='1')resolve();else found.addEventListener('load',resolve,{once:true});return;}const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='1';s.onload=()=>{s.dataset.loaded='1';resolve();};s.onerror=()=>{console.error('Failed to load '+src);resolve();};document.body.appendChild(s);});}
function refineAqaSandbox(){
  const api=window.__AQA_SANDBOX_V4;
  const defs=typeof practicals!=='undefined'&&Array.isArray(practicals)?practicals:null;
  if(!api?.config||!defs)return;
  defs.forEach(p=>{const c=api.config[p.id];if(c)c.at=[...(p.at||[])];});
  const p9=api.config[9];
  const readout=p9?.items?.find(x=>x[0]==='volt');
  if(readout)readout[1]='Voltmeter / oscilloscope / data logger';
}
async function start(){
  addLabView();
  loadStyle(versioned('lab-book.css'),'labBookStyle');
  loadStyle(versioned('lab-book-v2.css'),'labBookV2Style');
  loadStyle(versioned('lab-book-final.css'),'labBookFinalStyle');
  loadStyle(versioned('lab-book-examples.css'),'labBookExamplesStyle');
  loadStyle(versioned('learning-tools.css'),'learningToolsStyle');
  loadStyle(versioned('ui-polish-v3.css'),'uiPolishV3');
  loadStyle(versioned('experimental-sandbox-v4.css'),'experimentalSandboxV4Style');
  loadStyle(versioned('simulation-visuals-v5.css'),'simulationVisualsV5Style');
  loadStyle(versioned('realistic-instruments-v6.css'),'realisticInstrumentsV6Style');
  loadStyle(versioned('apparatus-interaction-v7.css'),'apparatusInteractionV7Style');
  loadStyle(versioned('free-build-bench-v8.css'),'freeBuildBenchV8Style');
  loadStyle(versioned('free-build-apparatus-v9.css'),'freeBuildApparatusV9Style');
  loadStyle(versioned('practical-3d.css'),'practical3DStyle');
  await loadScript(versioned('practical-3d-equipment-v11.js'),'practical3DEquipmentV11');
  await loadScript(versioned('young-modulus-3d.js'),'youngModulus3D');
  await loadScript(versioned('aqa-setup-alignment.js'),'aqaSetupAlignment');
  await loadScript(versioned('aqa-setup-visual-fixes.js'),'aqaSetupVisualFixes');
  await loadScript(versioned('p2-visual-accuracy.js'),'p2VisualAccuracy');
  await loadScript(versioned('p4-p6-run-accuracy.js'),'p4P6RunAccuracy');
  await loadScript(versioned('animation-runtime-v2.js'),'animationRuntimeV2');
  await loadScript(versioned('experimental-sandbox-v4.js'),'experimentalSandboxV4');
  refineAqaSandbox();
  await loadScript(versioned('simulation-visuals-v5.js'),'simulationVisualsV5');
  await loadScript(versioned('realistic-instruments-v6.js'),'realisticInstrumentsV6');
  await loadScript(versioned('apparatus-interaction-v7.js'),'apparatusInteractionV7');
  await loadScript(versioned('free-build-core-v8.js'),'freeBuildCoreV8');
  await loadScript(versioned('free-build-apparatus-v9.js'),'freeBuildApparatusV9');
  await loadScript(versioned('free-build-ui-v8.js'),'freeBuildUiV8');
  await loadScript(versioned('practical-toolkit-v4.js'),'practicalToolkitV4');
  await loadScript(versioned('feature-27-setup-snapshots.js'),'feature27SetupSnapshots');
  await loadScript(versioned('feature-28-repeat-analysis.js'),'feature28RepeatAnalysis');
  try{if(typeof renderHome==='function')renderHome();if(current&&typeof renderPractical==='function')renderPractical();}catch(e){console.error(e);}
  await loadScript(versioned('lab-book.js'),'labBookScript');
  await loadScript(versioned('lab-book-v2.js'),'labBookV2Script');
  await loadScript(versioned('lab-book-examples.js'),'labBookExamplesScript');
  await loadScript(versioned('lab-book-examples-complete.js'),'labBookExamplesCompleteScript');
  await loadScript(versioned('lab-book-example-detail-v2b.js'),'labBookExampleDetailV2');
  await loadScript(versioned('lab-book-example-detail-v3.js'),'labBookExampleDetailV3');
  await loadScript(versioned('lab-book-inline-switch.js'),'labBookInlineSwitch');
  await loadScript(versioned('learning-tools-core.js'),'learningToolsCore');
  try{if(document.querySelector('#view-labbook.active')&&window.renderLabBook)window.renderLabBook();}catch(e){console.error(e);}
  window.__enhancementStackReady=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();