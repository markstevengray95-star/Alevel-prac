(()=>{
'use strict';
let mode='mine';
let decorating=false;

function ensureStyle(){
  if(document.querySelector('#labBookInlineSwitchStyle'))return;
  const s=document.createElement('style');
  s.id='labBookInlineSwitchStyle';
  s.textContent=`
    .lb-mode-switch{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 18px;padding:10px;border:1px solid var(--line,#d8ded9);border-radius:16px;background:var(--paper,#fff);box-shadow:0 8px 24px rgba(20,55,44,.07)}
    .lb-mode-switch-copy{min-width:0}.lb-mode-switch-copy b{display:block;font-size:14px}.lb-mode-switch-copy small{display:block;margin-top:3px;color:var(--muted,#64736d);line-height:1.35}
    .lb-mode-buttons{display:flex;gap:6px;padding:4px;border-radius:12px;background:rgba(35,78,64,.07);flex:0 0 auto}.lb-mode-buttons button{border:0;border-radius:9px;padding:10px 14px;background:transparent;color:var(--text,#20342d);font-weight:800;cursor:pointer}.lb-mode-buttons button.active{background:#234e40;color:#fff;box-shadow:0 4px 12px rgba(35,78,64,.22)}
    #lbMinePane[hidden],#lbCompletedExamplePane[hidden]{display:none!important}
    #lbCompletedExamplePane .ex-sheet{position:static!important;inset:auto!important;width:100%!important;max-width:none!important;max-height:none!important;overflow:visible!important;margin:0!important;border-radius:18px!important;box-shadow:none!important;border:1px solid var(--line,#d8ded9)!important}
    #lbCompletedExamplePane .ex-head{position:static!important}.lb-inline-example-note{margin:0 0 12px;padding:12px 14px;border-radius:12px;background:rgba(211,236,166,.22);border:1px solid rgba(35,78,64,.14);font-size:12px;line-height:1.5}
    body.ex-open{overflow:auto!important}
    @media(max-width:700px){.lb-mode-switch{align-items:stretch;flex-direction:column}.lb-mode-buttons{width:100%}.lb-mode-buttons button{flex:1}.lb-mode-switch-copy small{font-size:11px}}
  `;
  document.head.appendChild(s);
}

function root(){return document.querySelector('#labBookRoot');}
function selectedId(){return +(document.querySelector('#lbMinePane #lbSelect')?.value||document.querySelector('#lbSelect')?.value||state?.last||1);}
function cleanLegacy(){
  document.querySelector('#examplesNavBtn')?.remove();
  root()?.querySelector('#exampleLibraryPanel')?.remove();
  root()?.querySelector('.ex-launch')?.remove();
}
function updateSwitch(){
  const mine=document.querySelector('#lbModeMine'),example=document.querySelector('#lbModeExample');
  if(mine)mine.classList.toggle('active',mode==='mine');
  if(example)example.classList.toggle('active',mode==='example');
  const a=document.querySelector('#lbMinePane'),b=document.querySelector('#lbCompletedExamplePane');
  if(a)a.hidden=mode!=='mine';if(b)b.hidden=mode!=='example';
}
function adoptModal(){
  const modal=document.querySelector('#labExampleModal');
  const pane=document.querySelector('#lbCompletedExamplePane');
  if(!modal||!pane)return false;
  const sheet=modal.querySelector('.ex-sheet');
  if(!sheet)return false;
  sheet.removeAttribute('aria-modal');sheet.setAttribute('role','region');sheet.classList.add('ex-inline-sheet');
  sheet.querySelectorAll('[data-ex-close]').forEach(x=>x.remove());
  pane.replaceChildren(sheet);
  modal.remove();document.body.classList.remove('ex-open');
  return true;
}
function renderExample(id){
  const pane=document.querySelector('#lbCompletedExamplePane');if(!pane)return;
  pane.innerHTML='<div class="lb-inline-example-note"><b>Completed example:</b> this is an illustrative model record. Students should use their own measurements and observations in their assessed lab book.</div><div class="lb-loading">Loading completed example…</div>';
  if(typeof window.showLabBookExample!=='function'){pane.innerHTML='<div class="lb-panel"><b>Example record failed to load.</b><p>Refresh the page and reopen Lab book.</p></div>';return;}
  window.showLabBookExample(+id);
  requestAnimationFrame(()=>{if(!adoptModal())setTimeout(adoptModal,40);});
}
function switchMode(next){
  if(next==='mine'){
    const exId=+(document.querySelector('#lbCompletedExamplePane #exSelect')?.value||selectedId());
    const mainSel=document.querySelector('#lbMinePane #lbSelect');
    mode='mine';updateSwitch();
    if(mainSel&&+mainSel.value!==exId){mainSel.value=String(exId);mainSel.dispatchEvent(new Event('change',{bubbles:true}));}
    return;
  }
  mode='example';updateSwitch();renderExample(selectedId());
}
function decorate(){
  if(decorating)return;const r=root();if(!r||r.querySelector('#lbModeSwitch'))return;
  decorating=true;ensureStyle();cleanLegacy();
  const mine=document.createElement('div');mine.id='lbMinePane';
  while(r.firstChild)mine.appendChild(r.firstChild);
  mine.querySelector('#exampleLibraryPanel')?.remove();mine.querySelector('.ex-launch')?.remove();
  const sw=document.createElement('div');sw.id='lbModeSwitch';sw.className='lb-mode-switch';sw.innerHTML=`<div class="lb-mode-switch-copy"><b>Choose what to view</b><small>Switch between the student's editable record and a fully completed worked example for the same practical.</small></div><div class="lb-mode-buttons" role="group" aria-label="Lab book view"><button id="lbModeMine" type="button">My lab book</button><button id="lbModeExample" type="button">Completed example</button></div>`;
  const example=document.createElement('div');example.id='lbCompletedExamplePane';example.hidden=true;
  r.append(sw,mine,example);
  sw.querySelector('#lbModeMine').onclick=()=>switchMode('mine');
  sw.querySelector('#lbModeExample').onclick=()=>switchMode('example');
  updateSwitch();
  if(mode==='example')renderExample(selectedId());
  decorating=false;
}

const modalObserver=new MutationObserver(()=>{if(mode==='example')adoptModal();});
modalObserver.observe(document.body,{childList:true});

const prior=window.renderLabBook;
if(typeof prior==='function'){
  window.renderLabBook=function(){const out=prior.apply(this,arguments);setTimeout(decorate,0);return out;};
}
document.addEventListener('change',e=>{
  if(e.target?.id==='exSelect'&&mode==='example')setTimeout(adoptModal,0);
});
document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-view="labbook"]'))setTimeout(decorate,30);
});
setTimeout(decorate,0);setTimeout(decorate,250);
window.__labBookInlineSwitch={mode:()=>mode,switchTo:switchMode};
})();