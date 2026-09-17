(()=>{
'use strict';
const MAX_SLOTS=3;
let lastKey='';
function keyFor(){return current?`${current.id}_${currentMode}`:'';}
function ensureState(){if(!state.setupSnapshots||typeof state.setupSnapshots!=='object'||Array.isArray(state.setupSnapshots))state.setupSnapshots={};return state.setupSnapshots;}
function slots(){const all=ensureState(),k=keyFor();if(!Array.isArray(all[k]))all[k]=Array(MAX_SLOTS).fill(null);while(all[k].length<MAX_SLOTS)all[k].push(null);all[k].length=MAX_SLOTS;return all[k];}
function summary(vals){
  if(!current)return '';
  return vals.map((v,i)=>{const spec=modeVar(i);return `${spec[0]} ${formatVal(v,spec[1])}`;}).slice(0,2).join(' · ');
}
function ensurePanel(force=false){
  if(!current)return null;
  const controls=document.querySelector('#controls');if(!controls)return null;
  const k=keyFor();let root=document.querySelector('#setupSnapshots'),created=false;
  if(!root){
    root=document.createElement('section');root.id='setupSnapshots';root.className='setup-snapshots';created=true;
    root.innerHTML=`<div class="setup-snapshots-head"><div><span class="eyebrow">SETUP SNAPSHOTS</span><h3>Save apparatus settings</h3></div><p>Store up to three parameter sets for quick comparison.</p></div><div class="snapshot-grid" id="snapshotGrid"></div>`;
    controls.insertAdjacentElement('afterend',root);
  }
  if(created||force||k!==lastKey){lastKey=k;render();}
  return root;
}
function render(){
  const root=document.querySelector('#setupSnapshots');if(!root||!current)return;
  lastKey=keyFor();
  const list=slots();
  root.querySelector('#snapshotGrid').innerHTML=list.map((snap,i)=>snap?`
    <article class="snapshot-card saved"><div class="snapshot-slot">SETUP ${String.fromCharCode(65+i)}</div><strong>${escapeHtml(snap.label||summary(snap.vals))}</strong><small>${escapeHtml(snap.summary||summary(snap.vals))}</small><div><button class="secondary-btn" data-restore-snap="${i}">Restore</button><button class="ghost-btn" data-save-snap="${i}">Replace</button><button class="ghost-btn" data-delete-snap="${i}" aria-label="Delete setup ${String.fromCharCode(65+i)}">Delete</button></div></article>`:`
    <article class="snapshot-card empty"><div class="snapshot-slot">SETUP ${String.fromCharCode(65+i)}</div><strong>Empty slot</strong><small>Save the current slider/apparatus settings here.</small><button class="secondary-btn" data-save-snap="${i}">Save current setup</button></article>`).join('');
  root.querySelectorAll('[data-save-snap]').forEach(b=>b.onclick=()=>saveSlot(+b.dataset.saveSnap));
  root.querySelectorAll('[data-restore-snap]').forEach(b=>b.onclick=()=>restoreSlot(+b.dataset.restoreSnap));
  root.querySelectorAll('[data-delete-snap]').forEach(b=>b.onclick=()=>deleteSlot(+b.dataset.deleteSnap));
}
function saveSlot(index){
  if(!current)return;const vals=[...getVals()],list=slots();
  list[index]={vals,label:`Setup ${String.fromCharCode(65+index)}`,summary:summary(vals),savedAt:Date.now()};save();render();flash(`Saved setup ${String.fromCharCode(65+index)}`);
}
function restoreSlot(index){
  const snap=slots()[index];if(!snap||!Array.isArray(snap.vals))return;
  const vals=getVals();snap.vals.forEach((v,i)=>{const spec=modeVar(i);vals[i]=Math.min(+spec[3],Math.max(+spec[2],+v));});
  save();renderControls();renderScene();updateReadouts();window.__animationRuntime?.requestFullPaint?.();render();flash(`Restored setup ${String.fromCharCode(65+index)}`);
}
function deleteSlot(index){slots()[index]=null;save();render();flash(`Cleared setup ${String.fromCharCode(65+index)}`);}
function flash(text){
  const root=document.querySelector('#setupSnapshots');if(!root)return;let n=root.querySelector('.snapshot-toast');if(!n){n=document.createElement('div');n.className='snapshot-toast';root.appendChild(n);}n.textContent=text;n.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>n.classList.remove('show'),1100);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

document.addEventListener('practicallab:frame',()=>{if(current&&(!document.querySelector('#setupSnapshots')||keyFor()!==lastKey))ensurePanel();});
document.addEventListener('practicallab:runstate',()=>{if(current)ensurePanel();});
setInterval(()=>{if(current&&(!document.querySelector('#setupSnapshots')||keyFor()!==lastKey))ensurePanel();},900);
window.__setupSnapshotsReady=true;
})();
