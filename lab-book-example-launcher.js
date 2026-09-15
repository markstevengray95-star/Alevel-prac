(()=>{
'use strict';
function ensureStyle(){
 if(document.querySelector('#exampleLauncherStyle'))return;
 const s=document.createElement('style');s.id='exampleLauncherStyle';s.textContent=`
 .example-library{margin:18px 0 24px;padding:20px;border:1px solid var(--line,#d8ded9);border-radius:18px;background:linear-gradient(135deg,rgba(211,236,166,.18),rgba(255,255,255,.72));box-shadow:0 10px 28px rgba(20,55,44,.07)}
 .example-library-head{display:flex;gap:18px;align-items:flex-start;justify-content:space-between;margin-bottom:14px}.example-library-head h3{margin:3px 0 6px;font-size:22px}.example-library-head p{margin:0;max-width:760px;color:var(--muted,#64736d);line-height:1.55}.example-library-badge{white-space:nowrap;padding:7px 10px;border-radius:999px;background:#234e40;color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em}
 .example-card-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.example-card{appearance:none;text-align:left;border:1px solid var(--line,#d8ded9);border-radius:14px;background:var(--paper,#fff);padding:13px;cursor:pointer;transition:.18s transform,.18s box-shadow,.18s border-color}.example-card:hover,.example-card:focus-visible{transform:translateY(-2px);box-shadow:0 8px 20px rgba(20,55,44,.12);border-color:#6f8d7f;outline:none}.example-card small{display:block;color:#6f8d7f;font-weight:800;letter-spacing:.08em;margin-bottom:5px}.example-card b{display:block;font-size:13px;line-height:1.35}.example-card span{display:block;margin-top:7px;font-size:11px;color:var(--muted,#64736d)}
 .examples-nav-btn{font-weight:800!important}.examples-nav-btn::after{content:' NEW';font-size:8px;margin-left:4px;padding:2px 4px;border-radius:5px;background:#d3eca6;color:#234e40;vertical-align:top}
 @media(max-width:900px){.example-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.example-library-head{display:block}.example-library-badge{display:inline-block;margin-top:10px}}@media(max-width:520px){.example-card-grid{grid-template-columns:1fr}.example-library{padding:14px}.example-library-head h3{font-size:19px}}
 `;document.head.appendChild(s);
}
function exampleTitle(p){return p?.title||`Required practical ${p?.id||''}`;}
function openExample(id){
 const launch=()=>{if(typeof window.showLabBookExample==='function')window.showLabBookExample(+id);};
 if(typeof navigate==='function')navigate('labbook');
 setTimeout(launch,50);setTimeout(launch,250);
}
function ensureNav(){
 const nav=document.querySelector('.lab-header nav');if(!nav||nav.querySelector('#examplesNavBtn'))return;
 const b=document.createElement('button');b.id='examplesNavBtn';b.className='examples-nav-btn';b.type='button';b.textContent='Examples';b.onclick=()=>openExample(state?.last||1);nav.appendChild(b);
}
function ensurePanel(){
 const root=document.querySelector('#labBookRoot');if(!root||root.querySelector('#exampleLibraryPanel')||!Array.isArray(window.practicals||practicals))return;
 const list=window.practicals||practicals;
 const panel=document.createElement('section');panel.id='exampleLibraryPanel';panel.className='example-library';panel.innerHTML=`<div class="example-library-head"><div><span class="eyebrow">COMPLETED MODEL RECORDS</span><h3>Completed example lab books</h3><p>Open a fully worked example for any required practical. Each example includes sample results, uncertainties, calculations, graph processing, conclusion and evaluation. Use these as a guide to structure—not as a replacement for your own evidence.</p></div><span class="example-library-badge">12 examples</span></div><div class="example-card-grid">${list.map(p=>`<button class="example-card" type="button" data-example-id="${p.id}"><small>PRACTICAL ${p.id}</small><b>${exampleTitle(p)}</b><span>View completed example →</span></button>`).join('')}</div>`;
 root.prepend(panel);
 panel.querySelectorAll('[data-example-id]').forEach(b=>b.onclick=()=>openExample(+b.dataset.exampleId));
}
function refresh(){ensureStyle();ensureNav();ensurePanel();}
const obs=new MutationObserver(()=>{if(document.querySelector('#view-labbook'))refresh();});obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',refresh,{once:true});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-view="labbook"]'))setTimeout(refresh,40);});
setTimeout(refresh,0);setTimeout(refresh,300);setTimeout(refresh,1000);
window.openLabBookExample=openExample;
})();