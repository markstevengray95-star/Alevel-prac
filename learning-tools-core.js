(()=>{
'use strict';
const registry=new Map();
state.learningTools=state.learningTools||{};
const suite=state.learningTools;
suite.completed=suite.completed||{};suite.settings=suite.settings||{};suite.teacher=suite.teacher||{};
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function addView(){
 const main=document.querySelector('main');if(!main)return;
 if(!document.querySelector('#view-tools')){const s=document.createElement('section');s.id='view-tools';s.className='view';s.innerHTML='<div id="learningToolsRoot" class="tools-shell"></div>';main.appendChild(s);}
 const nav=document.querySelector('.lab-header nav');if(nav&&!nav.querySelector('[data-view="tools"]')){const b=document.createElement('button');b.dataset.view='tools';b.textContent='Learning tools';b.onclick=()=>navigate('tools');nav.appendChild(b);}
}
function pct(){const n=[...registry.keys()].filter(k=>suite.completed[k]).length,d=Math.max(1,registry.size);return Math.round(n/d*100);}
function renderHome(){
 const root=document.querySelector('#learningToolsRoot');if(!root)return;
 const items=[...registry.entries()].sort((a,b)=>a[0]-b[0]);
 root.innerHTML=`<div class="tools-hero"><div><span class="eyebrow">PRACTICAL LEARNING SUITE</span><h1>Learning tools</h1><p>Coach, analyse, troubleshoot, practise exam skills and build a stronger practical record across all 12 AQA required practicals.</p></div><div class="tools-progress"><b>${pct()}%</b><small>feature activities completed</small><div class="tool-meter"><i style="width:${pct()}%"></i></div></div></div><div class="tools-grid">${items.map(([id,m])=>`<button class="tool-card" data-tool="${id}" type="button"><span class="tool-icon">${m.icon||'◆'}</span><small>TOOL ${String(id).padStart(2,'0')}</small><h3>${esc(m.title)}</h3><p>${esc(m.description||'')}</p><span class="tool-state">${suite.completed[id]?'Completed ✓':'Open tool →'}</span></button>`).join('')}</div>`;
 root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>open(+b.dataset.tool));
}
function open(id,opts={}){const m=registry.get(+id);const root=document.querySelector('#learningToolsRoot');if(!m||!root)return;if(!document.querySelector('#view-tools.active'))navigate('tools');root.innerHTML=`<div class="tool-workspace"><div class="tool-workspace-head"><button class="secondary-btn" id="toolBack">← Learning tools</button><div><span class="eyebrow">${esc(m.kicker||'PRACTICAL SKILLS')}</span><h2>${esc(m.title)}</h2></div></div><div id="toolBody"></div></div>`;root.querySelector('#toolBack').onclick=renderHome;try{m.render(root.querySelector('#toolBody'),opts);}catch(e){console.error(e);root.querySelector('#toolBody').innerHTML='<div class="tool-panel"><b>This tool could not load.</b><p>Please refresh and try again.</p></div>';}}
function register(id,meta){registry.set(+id,meta);if(document.querySelector('#view-tools.active')&&!document.querySelector('.tool-workspace'))renderHome();}
function mark(id,value=true){suite.completed[id]=value;save();}
function practical(id){return practicals.find(p=>p.id===+(id||state.last||1))||practicals[0];}
function data(id,mode=0){return state.data?.[`${id}_${mode}`]||[];}
function button(label,handler,cls='secondary-btn'){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.onclick=handler;return b;}
function download(name,text,type='text/plain'){const blob=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);}
function addPracticalButton(id,label,handler){const bar=document.querySelector('#view-practical .revision-toolbar');if(!bar||bar.querySelector(`[data-suite-btn="${id}"]`))return;const b=button(label,handler);b.dataset.suiteBtn=id;bar.appendChild(b);}
function addLabButton(id,label,handler){const root=document.querySelector('#labBookRoot');if(!root||root.querySelector(`[data-suite-lab="${id}"]`))return;const host=root.querySelector('#lbModeSwitch')||root.firstElementChild;if(!host)return;const b=button(label,handler);b.dataset.suiteLab=id;b.classList.add('tool-mini-btn');host.appendChild(b);}
function refreshDecorators(){registry.forEach((m,id)=>{try{m.decorate?.({id,addPracticalButton,addLabButton,open});}catch(e){console.error(e);}});}
const obs=new MutationObserver(()=>refreshDecorators());obs.observe(document.body,{childList:true,subtree:true});
const oldNavigate=window.navigate;window.navigate=function(view,id){const r=oldNavigate.apply(this,arguments);if(view==='tools')setTimeout(renderHome,0);setTimeout(refreshDecorators,0);return r;};
addView();
window.PracticalTools={register,open,renderHome,mark,esc,practical,data,suite,download,button,addPracticalButton,addLabButton,refreshDecorators};
const files=Array.from({length:15},(_,i)=>`feature-${String(i+1).padStart(2,'0')}.js`);
Promise.all(files.map(src=>new Promise(resolve=>{const s=document.createElement('script');s.src=src+'?v=20260915-suite1';s.async=false;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s);}))).then(()=>{window.__learningToolsReady=true;renderHome();refreshDecorators();});
})();