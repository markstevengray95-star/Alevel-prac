(()=>{
function loadStyle(href,key){if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l);}
function addLabView(){
  const main=document.querySelector('main');if(!main)return;
  if(!document.querySelector('#view-labbook')){
    const section=document.createElement('section');section.id='view-labbook';section.className='view';section.innerHTML=`<div class="page-heading"><span class="eyebrow">PRACTICAL RECORD</span><h1>Lab book</h1><p>Build a live record for each AQA required practical: set-up, variables, method, raw data, uncertainty, processing, conclusion and evaluation.</p></div><div id="labBookRoot"></div>`;main.appendChild(section);
  }
  const nav=document.querySelector('.lab-header nav');
  if(nav&&!nav.querySelector('[data-view="labbook"]')){
    const b=document.createElement('button');b.dataset.view='labbook';b.textContent='Lab book';b.onclick=()=>navigate('labbook');nav.appendChild(b);
  }
}
function loadScript(src,key,onload){if(document.querySelector(`script[data-${key}]`)){onload?.();return;}const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='1';s.onload=()=>onload?.();document.body.appendChild(s);}
function start(){
  addLabView();loadStyle('lab-book.css','labBookStyle');
  loadScript('aqa-setup-alignment.js','aqaSetupAlignment',()=>{
    loadScript('aqa-setup-visual-fixes.js','aqaSetupVisualFixes',()=>{
      try{if(typeof renderHome==='function')renderHome();if(current&&typeof renderPractical==='function')renderPractical();}catch(e){console.error(e);}
      loadScript('lab-book.js','labBookScript',()=>{try{if(document.querySelector('#view-labbook.active')&&typeof renderLabBook==='function')renderLabBook();}catch(e){console.error(e);}});
    });
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();