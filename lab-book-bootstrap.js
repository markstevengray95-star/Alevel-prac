(()=>{
'use strict';
function loadStyle(href,key){if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l);}
function addLabView(){
  const main=document.querySelector('main');if(!main)return;
  if(!document.querySelector('#view-labbook')){
    const section=document.createElement('section');section.id='view-labbook';section.className='view';section.innerHTML=`<div class="page-heading"><span class="eyebrow">AQA PRACTICAL RECORD</span><h1>Lab book</h1><p>Record what you actually did, measured, processed and concluded for each required practical.</p></div><div id="labBookRoot"></div>`;main.appendChild(section);
  }
  const nav=document.querySelector('.lab-header nav');
  if(nav&&!nav.querySelector('[data-view="labbook"]')){const b=document.createElement('button');b.dataset.view='labbook';b.textContent='Lab book';b.onclick=()=>navigate('labbook');nav.appendChild(b);}
}
function loadScript(src,key){return new Promise(resolve=>{const found=document.querySelector(`script[data-${key}]`);if(found){if(found.dataset.loaded==='1')resolve();else found.addEventListener('load',resolve,{once:true});return;}const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='1';s.onload=()=>{s.dataset.loaded='1';resolve();};s.onerror=()=>{console.error('Failed to load '+src);resolve();};document.body.appendChild(s);});}
async function start(){
  addLabView();
  loadStyle('lab-book.css','labBookStyle');
  loadStyle('lab-book-v2.css','labBookV2Style');
  loadStyle('lab-book-examples.css','labBookExamplesStyle');
  await loadScript('aqa-setup-alignment.js','aqaSetupAlignment');
  await loadScript('aqa-setup-visual-fixes.js','aqaSetupVisualFixes');
  try{if(typeof renderHome==='function')renderHome();if(current&&typeof renderPractical==='function')renderPractical();}catch(e){console.error(e);}
  await loadScript('lab-book.js','labBookScript');
  await loadScript('lab-book-v2.js','labBookV2Script');
  await loadScript('lab-book-examples.js','labBookExamplesScript');
  await loadScript('lab-book-inline-switch.js','labBookInlineSwitch');
  await loadScript('animation-runtime-v2.js','animationRuntimeV2');
  try{if(document.querySelector('#view-labbook.active')&&window.renderLabBook)window.renderLabBook();}catch(e){console.error(e);}
  window.__enhancementStackReady=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();