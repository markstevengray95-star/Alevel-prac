(()=>{
'use strict';
const REV='20260916-first-three-physics-fixes1';
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
async function start(){
  addLabView();
  loadStyle(versioned('lab-book.css'),'labBookStyle');
  loadStyle(versioned('lab-book-v2.css'),'labBookV2Style');
  loadStyle(versioned('lab-book-final.css'),'labBookFinalStyle');
  loadStyle(versioned('lab-book-examples.css'),'labBookExamplesStyle');
  loadStyle(versioned('learning-tools.css'),'learningToolsStyle');
  loadStyle(versioned('ui-polish-v3.css'),'uiPolishV3');
  await loadScript(versioned('young-modulus-3d.js'),'youngModulus3D');
  await loadScript(versioned('aqa-setup-alignment.js'),'aqaSetupAlignment');
  await loadScript(versioned('aqa-setup-visual-fixes.js'),'aqaSetupVisualFixes');
  await loadScript(versioned('p2-visual-accuracy.js'),'p2VisualAccuracy');
  try{if(typeof renderHome==='function')renderHome();if(current&&typeof renderPractical==='function')renderPractical();}catch(e){console.error(e);}
  await loadScript(versioned('lab-book.js'),'labBookScript');
  await loadScript(versioned('lab-book-v2.js'),'labBookV2Script');
  await loadScript(versioned('lab-book-examples.js'),'labBookExamplesScript');
  await loadScript(versioned('lab-book-examples-complete.js'),'labBookExamplesCompleteScript');
  await loadScript(versioned('lab-book-example-detail-v2b.js'),'labBookExampleDetailV2');
  await loadScript(versioned('lab-book-example-detail-v3.js'),'labBookExampleDetailV3');
  await loadScript(versioned('lab-book-inline-switch.js'),'labBookInlineSwitch');
  await loadScript(versioned('learning-tools-core.js'),'learningToolsCore');
  await loadScript(versioned('animation-runtime-v2.js'),'animationRuntimeV2');
  try{if(document.querySelector('#view-labbook.active')&&window.renderLabBook)window.renderLabBook();}catch(e){console.error(e);}
  window.__enhancementStackReady=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
