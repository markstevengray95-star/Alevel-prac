'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const scripts=['data-base.js',...Array.from({length:12},(_,i)=>`p${i+1}.js`),'data-extra.js','core-a.js','core-b.js','scene-helpers.js','scene-p1-4.js','scene-p5-8.js','scene-p9-12.js','scene-dispatch.js','accuracy-fixes.js','accuracy-p2-p6.js','accuracy-p7-p12.js','accuracy-final.js','accuracy-browser-fixes.js','aqa-setup-alignment.js','aqa-setup-visual-fixes.js'];
const alerts=[];
const ctx={console,Math,alert:m=>alerts.push(m),localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:()=>null,querySelectorAll:()=>[],readyState:'loading'},addEventListener(){},runExperiment(){},resetExperiment(){},renderP1Scene(){},renderP2Scene(){},renderP3Scene(){},renderP4Scene(){},renderP5Scene(){},renderP6Scene(){},renderP7Scene(){},renderP8Scene(){},renderP9Scene(){},renderP10Scene(){},renderP11Scene(){},renderP12Scene(){}};
ctx.window=ctx;
vm.createContext(ctx);
for(const file of scripts)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const count=vm.runInContext('practicals.length',ctx);
let failures=[];
for(let id=1;id<=count;id++){
  const modeCount=vm.runInContext(`practicals[${id-1}].modes.length`,ctx);
  for(let mode=0;mode<modeCount;mode++){
    vm.runInContext(`current=practicals[${id-1}];currentMode=${mode};simT=0;`,ctx);
    const vars=vm.runInContext('current.vars.map((_,i)=>modeVar(i))',ctx);
    const combos=[vars.map(v=>v[4]),vars.map(v=>v[2]),vars.map(v=>v[3])];
    for(let caseNo=0;caseNo<combos.length;caseNo++){
      const vals=combos[caseNo];
      const out=vm.runInContext(`theoretical(${JSON.stringify(vals)})`,ctx);
      if(!Number.isFinite(out.x)||!Number.isFinite(out.y))failures.push({id,mode,caseNo,vals,x:out.x,y:out.y});
    }
  }
}
assert.deepEqual(failures,[],'every default/min/max mode output should be finite');
vm.runInContext('current=practicals[1];currentMode=1;state.p2_grating_order=5;',ctx);
const staleOrder=vm.runInContext('theoretical([700,1.5,0.001])',ctx);
assert.equal(staleOrder.x,1,'stale grating order must be clamped to physical maximum');
assert.ok(Number.isFinite(staleOrder.y));
assert.equal(vm.runInContext('state.p2_grating_order',ctx),1);
const before=vm.runInContext('getData().length',ctx);
vm.runInContext('theoretical=()=>({x:NaN,y:1});record(1)',ctx);
assert.equal(vm.runInContext('getData().length',ctx),before,'recording must reject nonfinite model values');
assert.equal(alerts.length,1);
vm.runInContext("current=practicals[3];currentMode=0;state.vals_4_0=[30,1.5,0.20];",ctx);
const young=vm.runInContext('getVals()',ctx);
assert.equal(young[0],20);
assert.equal(young[2],0.40);
assert.ok(young[0]/(Math.PI*(young[2]/1000)**2/4)<160e6,'P4 maximum tensile stress should stay near the ideal elastic regime');
assert.equal(vm.runInContext('getVals()===state.vals_4_0',ctx),true,'input arrays should retain identity for slider closures');
vm.runInContext("current=practicals[4];currentMode=0;state.vals_5_0=[0.2,3,0.80];",ctx);
const resistivity=vm.runInContext('getVals()',ctx);
assert.equal(resistivity[1],0.25);
assert.equal(resistivity[2],0.50);
const resistance=4.9e-7*resistivity[0]/(Math.PI*(resistivity[2]/1000)**2/4);
assert.ok(resistivity[1]/resistance<=0.51,'P5 maximum current should be controlled');
const damagedState={console,localStorage:{getItem:()=>'{bad json'},document:{querySelector:()=>null,querySelectorAll:()=>[]}};
vm.createContext(damagedState);
assert.doesNotThrow(()=>vm.runInContext(fs.readFileSync(path.join(root,'core-a.js'),'utf8'),damagedState));
console.log(`All ${count} practicals passed finite model sweeps; grating order and record guards passed.`);
