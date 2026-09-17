(()=>{
'use strict';
let observer=null,lastKey='';
const finite=n=>Number.isFinite(Number(n));
function currentRows(){try{return (getData?.()||[]).filter(r=>finite(r?.y));}catch{return [];}}
function latestRepeats(rows){
  if(rows.length<2)return rows.slice(-3);
  const last=rows[rows.length-1];
  if(last?.rep&&Number(last.rep)>1){const group=[];for(let i=rows.length-1;i>=0&&group.length<3;i--){group.unshift(rows[i]);if(Number(rows[i].rep)===1)break;}if(group.length>=2)return group;}
  return rows.slice(-Math.min(3,rows.length));
}
function stats(rows){
  const ys=rows.map(r=>Number(r.y)).filter(Number.isFinite);if(!ys.length)return null;
  const mean=ys.reduce((a,b)=>a+b,0)/ys.length,min=Math.min(...ys),max=Math.max(...ys),range=max-min,half=range/2,pct=Math.abs(mean)>1e-15?half/Math.abs(mean)*100:0;
  const variance=ys.length>1?ys.reduce((s,v)=>s+(v-mean)**2,0)/(ys.length-1):0,sd=Math.sqrt(variance);
  return{n:ys.length,mean,min,max,range,half,pct,sd};
}
function fmt(n){if(!Number.isFinite(n))return '—';const a=Math.abs(n);return a!==0&&(a<0.001||a>=10000)?n.toExponential(3):n.toFixed(a<10?4:a<100?3:2);}
function consistency(pct,n){if(n<3)return['Need 3 repeats','Take three repeats before judging spread.','neutral'];if(pct<=1)return['Tight repeat spread','Half-range is at most 1% of the mean.','good'];if(pct<=3)return['Small repeat spread','Half-range is between 1% and 3% of the mean.','good'];if(pct<=7)return['Noticeable spread','Consider another repeat and check reading technique.','warn'];return['Wide repeat spread','Check for an anomalous reading or a variable that was not controlled.','warn'];}
function ensurePanel(){
  if(!current)return null;const table=document.querySelector('#resultsTable');if(!table)return null;
  let root=document.querySelector('#repeatAnalyser');
  if(!root){
    root=document.createElement('section');root.id='repeatAnalyser';root.className='repeat-analyser';
    root.innerHTML=`<div class="repeat-head"><div><span class="eyebrow">REPEAT CHECK</span><h3>Reading consistency</h3></div><button class="secondary-btn" id="repeatTakeThree">Take 3 repeats</button></div><div id="repeatAnalysisBody"></div>`;
    table.insertAdjacentElement('afterend',root);
    root.querySelector('#repeatTakeThree').onclick=()=>{record(3);setTimeout(update,0);};
  }
  bindObserver(table);update();return root;
}
function bindObserver(table){
  if(observer&&observer.__target===table)return;if(observer)observer.disconnect();
  observer=new MutationObserver(()=>update());observer.__target=table;observer.observe(table,{childList:true,subtree:true,characterData:true});
}
function update(){
  const root=document.querySelector('#repeatAnalyser');if(!root||!current)return;
  const key=`${current.id}_${currentMode}`;if(key!==lastKey)lastKey=key;
  const rows=currentRows(),recent=latestRepeats(rows),s=stats(recent),body=root.querySelector('#repeatAnalysisBody');
  if(!s){body.innerHTML='<p class="repeat-empty">Record a reading or take three repeats. This panel will calculate the mean and repeat spread automatically.</p>';return;}
  const [title,detail,tone]=consistency(s.pct,s.n),axis=current?.y||'measured value';
  body.innerHTML=`<div class="repeat-metrics"><div><small>Latest repeat set</small><strong>${s.n}</strong></div><div><small>Mean ${escapeHtml(axis)}</small><strong>${fmt(s.mean)}</strong></div><div><small>Range</small><strong>${fmt(s.range)}</strong></div><div><small>Half-range</small><strong>±${fmt(s.half)}</strong></div><div><small>Half-range / mean</small><strong>${s.pct.toFixed(2)}%</strong></div></div><div class="repeat-verdict ${tone}"><b>${title}</b><span>${detail}</span></div><p class="repeat-note">This is a simulation repeat check. In a real practical, use the resolution/uncertainty of the measuring instrument as well as the spread in repeated readings.</p>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
document.addEventListener('practicallab:frame',()=>{if(current)ensurePanel();});
document.addEventListener('practicallab:runstate',()=>{if(current)ensurePanel();});
setInterval(()=>{if(current)ensurePanel();},950);
window.__repeatAnalysisReady=true;
})();
