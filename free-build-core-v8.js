(()=>{
'use strict';
if(window.__freeBuildCoreV8Ready)return;
const sandbox=()=>window.__AQA_SANDBOX_V4;
const modeOK=(e,m)=>e.length<3||e[2]===undefined||e[2]===m;
const ek=(a,b)=>[a,b].sort().join('|');
const REF={
1:{gen:[10,28],vib:[30,28],string:[50,28],pulley:[72,28],mass:[72,60],rule:[48,73]},
2:{light:[8,35],slits:[32,35],grating:[32,35],screen:[75,35],rule:[50,72],caliper:[20,72]},
3:{release:[28,10],ball:[28,30],plumb:[47,30],detector:[28,68],timer:[70,58],rule:[51,68]},
4:{support:[15,12],ref:[35,32],test:[56,32],masses:[56,72],vernier:[44,51],micro:[78,63]},
5:{psu:[8,20],amm:[28,20],switch:[48,20],wire:[50,55],slide:[66,55],volt:[78,22],rule:[48,76],micro:[82,72]},
6:{cell:[10,30],amm:[32,18],var:[55,18],switch:[78,30],volt:[42,62]},
7:{clamp:[15,12],pend:[40,30],fid:[42,69],spring:[40,28],mass:[40,68],timer:[75,42],rule:[62,72]},
8:{syringe:[30,26],seal:[30,44],masses:[30,68],micro:[73,58],cap:[35,32],bath:[35,57],therm:[57,45],rule:[74,64]},
9:{source:[10,30],switch:[32,30],cap:[54,30],res:[76,30],volt:[54,67]},
10:{balance:[62,68],magnet:[62,47],wire:[48,43],psu:[8,22],amm:[27,22],var:[45,22],rule:[78,22]},
11:{gen:[8,25],field:[38,42],search:[38,42],pro:[50,68],scope:[76,40]},
12:{gm:[18,42],scaler:[18,70],rule:[48,72],holder:[77,42],screen:[52,22]}
};
const CAL={
1:[['vib'],['rule'],['gen']],2:[['light','slits','grating'],['rule'],['caliper','grating']],3:[['plumb','release'],['rule'],['timer']],
4:[['support','ref','test'],['vernier'],['micro']],5:[['amm'],['volt','slide'],['micro']],6:[['volt'],['amm','var'],['switch']],
7:[['pend','spring','mass'],['rule','fid'],['timer']],8:[['syringe','seal','cap','bath'],['rule','therm'],['micro','therm']],9:[['volt','cap'],['source','cap'],['switch']],
10:[['balance'],['rule','wire'],['var','amm']],11:[['search','field'],['pro'],['gen','scope']],12:[['rule','holder','gm'],['scaler'],['scaler']]
};
function key(){return current?current.id+'_'+currentMode:'0_0';}
function root(){state.freeBuildV8=state.freeBuildV8||{};return state.freeBuildV8;}
function session(){const r=root(),k=key();if(!r[k])r[k]={placed:[],positions:{},links:[],cal:{},selected:null,started:false};return r[k];}
function cfg(){return sandbox()?.config?.[current?.id]||null;}
function items(){const c=cfg();return c?c.items.filter(x=>modeOK(x,currentMode)):[];}
function edges(){const c=cfg();return c?c.links.filter(x=>modeOK(x,currentMode)).map(x=>[x[0],x[1]]):[];}
function reqKeys(){return new Set(edges().map(x=>ek(x[0],x[1])));}
function item(id){return items().find(x=>x[0]===id)||null;}
function name(id){return item(id)?.[1]||id;}
function pos(id){return session().positions[id]||{x:50,y:45};}
function setPos(id,x,y){session().positions[id]={x:Math.max(4,Math.min(92,+x||50)),y:Math.max(6,Math.min(88,+y||45))};changed();}
function refPos(id){const p=REF[current.id]?.[id];if(p)return{x:p[0],y:p[1]};const i=items().findIndex(x=>x[0]===id);return{x:12+(i%4)*22,y:18+Math.floor(i/4)*32};}
function calTargets(i){return(CAL[current.id]?.[i]||[]).filter(id=>item(id));}
function nearX(a,b,t=14){return a&&b&&Math.abs(a.x-b.x)<=t}
function nearY(a,b,t=14){return a&&b&&Math.abs(a.y-b.y)<=t}
function right(a,b,dx=7){return a&&b&&b.x-a.x>=dx}
function below(a,b,dy=8){return a&&b&&b.y-a.y>=dy}
function geometry(){
 const s=session(),P=id=>s.placed.includes(id)?pos(id):null,c=[];const add=(n,ok)=>c.push({name:n,ok:!!ok});
 switch(current.id){
 case 1:add('Vibrator, string and pulley form one line',nearY(P('vib'),P('string'),12)&&nearY(P('string'),P('pulley'),12)&&right(P('vib'),P('string'))&&right(P('string'),P('pulley')));add('Mass hangs below pulley',below(P('pulley'),P('mass'),12)&&nearX(P('pulley'),P('mass'),12));break;
 case 2:{const o=currentMode===0?'slits':'grating';add('Source, optical element and screen share an optical axis',nearY(P('light'),P(o),11)&&nearY(P(o),P('screen'),11));add('Optical order is source to element to screen',right(P('light'),P(o),10)&&right(P(o),P('screen'),18));break;}
 case 3:add('Release is vertically above detector',nearX(P('release'),P('detector'),10)&&below(P('release'),P('detector'),28));break;
 case 4:add('Reference and test wires hang from support',P('support')&&P('ref')&&P('test')&&below(P('support'),P('ref'),8)&&below(P('support'),P('test'),8));add('Mass hanger is below test wire',below(P('test'),P('masses'),14)&&nearX(P('test'),P('masses'),20));break;
 case 5:add('Resistance wire is alongside metre rule',nearY(P('wire'),P('rule'),24));add('Sliding contact is on wire region',P('slide')&&P('wire')&&Math.hypot(P('slide').x-P('wire').x,P('slide').y-P('wire').y)<35);break;
 case 6:add('Main circuit components are all present on one bench',P('cell')&&P('amm')&&P('var')&&P('switch'));break;
 case 7:if(currentMode===0){add('Pendulum hangs below clamp',below(P('clamp'),P('pend'),10));add('Fiducial is below swing centre',below(P('pend'),P('fid'),12)&&nearX(P('pend'),P('fid'),22));}else{add('Spring hangs below clamp',below(P('clamp'),P('spring'),8));add('Mass hangs below spring',below(P('spring'),P('mass'),12)&&nearX(P('spring'),P('mass'),18));}break;
 case 8:if(currentMode===0)add('Mass holder acts below syringe plunger',below(P('syringe'),P('masses'),16)&&nearX(P('syringe'),P('masses'),18));else add('Capillary and thermometer are in water bath',P('cap')&&P('bath')&&P('therm')&&Math.hypot(P('cap').x-P('bath').x,P('cap').y-P('bath').y)<34&&Math.hypot(P('therm').x-P('bath').x,P('therm').y-P('bath').y)<38);break;
 case 9:add('RC components form one local circuit',P('source')&&P('switch')&&P('cap')&&P('res'));break;
 case 10:add('Wire passes through magnet region',P('wire')&&P('magnet')&&Math.hypot(P('wire').x-P('magnet').x,P('wire').y-P('magnet').y)<30);add('Magnet assembly sits over balance',below(P('magnet'),P('balance'),8)&&nearX(P('magnet'),P('balance'),18));break;
 case 11:add('Search coil is centred in field coil',P('search')&&P('field')&&Math.hypot(P('search').x-P('field').x,P('search').y-P('field').y)<16);break;
 case 12:add('Source and GM tube face each other',P('holder')&&P('gm')&&right(P('gm'),P('holder'),20)&&nearY(P('holder'),P('gm'),18));break;
 }return c;
}
function validate(){
 const s=session(),req=items().map(x=>x[0]),missing=req.filter(id=>!s.placed.includes(id)),rk=reqKeys(),valid=s.links.filter(k=>rk.has(k)),wrong=s.links.filter(k=>!rk.has(k)),miss=[...rk].filter(k=>!valid.includes(k)),cm=(cfg()?.cal||[]).map((x,i)=>i).filter(i=>!s.cal[i]),geo=geometry(),gb=geo.filter(x=>!x.ok);
 const total=req.length+rk.size+(cfg()?.cal?.length||0)+geo.length,done=total-missing.length-miss.length-cm.length-gb.length-wrong.length;
 return{ready:!missing.length&&!miss.length&&!wrong.length&&!cm.length&&!gb.length,score:Math.max(0,total?Math.round(done/total*100):100),missing,missLinks:miss,wrongLinks:wrong,calMissing:cm,geo,geoBad:gb};
}
function changed(){try{save();}catch{};document.dispatchEvent(new CustomEvent('freebuildv8:change'));}
function reset(){const s=session();s.placed=[];s.positions={};s.links=[];s.cal={};s.selected=null;s.started=true;changed();}
function reference(){const s=session();s.placed=items().map(x=>x[0]);s.positions={};s.placed.forEach(id=>s.positions[id]=refPos(id));s.links=[...reqKeys()];s.cal={};(cfg()?.cal||[]).forEach((_,i)=>s.cal[i]=true);s.started=true;changed();}
function place(id,x=45,y=45){const s=session();if(!item(id))return;if(!s.placed.includes(id))s.placed.push(id);s.positions[id]={x:+x||45,y:+y||45};s.started=true;changed();}
function remove(id){const s=session();s.placed=s.placed.filter(x=>x!==id);s.links=s.links.filter(k=>!k.split('|').includes(id));delete s.positions[id];if(s.selected===id)s.selected=null;changed();}
function connect(a,b){if(!a||!b||a===b)return;const k=ek(a,b),s=session();if(!s.links.includes(k))s.links.push(k);changed();}
function disconnect(k){const s=session();s.links=s.links.filter(x=>x!==k);changed();}
function calibrate(i,on=true){session().cal[i]=!!on;changed();}
function select(id){session().selected=id;changed();}
function setMode(){const s4=sandbox()?.session?.();if(!s4)return;s4.mode='freebuild';const s=session();if(!s.started)reset();else changed();}
function leaveMode(mode='guided'){const s4=sandbox()?.session?.();if(!s4)return;s4.mode=mode;changed();sandbox()?.render?.();}
function active(){return sandbox()?.session?.()?.mode==='freebuild';}
const oldRecord=record;
record=function(repeats=1){if(active()&&!validate().ready)return false;return oldRecord(repeats);};
window.__freeBuildBenchV8={version:'8.0',session,cfg,items,edges,name,pos,calTargets,validate,geometry,reset,reference,place,remove,connect,disconnect,calibrate,select,setPosition:setPos,setMode,leaveMode,isActive:active};
window.__freeBuildCoreV8Ready=true;
})();