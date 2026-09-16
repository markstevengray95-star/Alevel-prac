const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'lab-book-examples-complete.js'),'utf8');
const base=fs.readFileSync(path.join(root,'lab-book-examples.js'),'utf8');
const start=base.indexOf('const E={'),end=base.indexOf('\n};\nwindow.LAB_BOOK_EXAMPLES=E;',start);
assert.ok(start>=0&&end>start,'Could not locate the existing worked-example data');
const seed={};vm.runInNewContext(base.slice(start,end+3)+'\nglobalThis.examples=E;',seed);
const examples=seed.examples;
const context={window:{LAB_BOOK_EXAMPLES:examples},console};
vm.runInNewContext(source,context,{filename:'lab-book-examples-complete.js'});
for(let id=1;id<=12;id++){
 const x=examples[id];
 for(const key of ['aim','setup','variables','method','tables','calc','graph','result','conclusion','evaluation','reflection'])assert.ok(x[key],`RP${id}: ${key}`);
 assert.ok(x.tables.length>=2,`RP${id}: raw and processed tables`);
 for(const t of x.tables){assert.ok(t.headers.length>=2&&t.rows.length>=1,`RP${id}: table ${t.title}`);for(const row of t.rows)assert.equal(row.length,t.headers.length,`RP${id}: row columns in ${t.title}`);}
}
assert.equal(examples[1].tables.length,6,'RP1 covers three sweeps');
assert.equal(examples[2].tables.length,5,'RP2 covers measured grating spots as well as slits and processed angles');
assert.equal(examples[7].tables.length,4,'RP7 covers pendulum and spring');
assert.equal(examples[8].tables.length,5,'RP8 covers Boyle and Charles');
assert.equal(examples[9].tables.length,4,'RP9 covers charging and discharging');
assert.equal(examples[10].tables.length,6,'RP10 covers current, B and active length');
const num=s=>Number(s);
const close=(a,b,tol,label)=>assert.ok(Math.abs(a-b)<=tol,`${label}: ${a} vs ${b}`);
// Check processed rows against their raw readings for every generated repeated table.
for(let id=1;id<=12;id++)for(let i=0;i<examples[id].tables.length-1;i++){
 const raw=examples[id].tables[i],processed=examples[id].tables[i+1];
 if(!raw.title.includes('raw repeated readings')||!processed.title.includes('processed results'))continue;
 for(let j=0;j<raw.rows.length;j++){
  const ys=raw.rows[j].slice(1).map(num);
  close(num(processed.rows[j][1]),ys.reduce((a,b)=>a+b,0)/3,Math.pow(10,-Math.max(0,(String(processed.rows[j][1]).split('.')[1]||'').length))*.51,`RP${id} mean row ${j}`);
  close(num(processed.rows[j][2]),(Math.max(...ys)-Math.min(...ys))/2,.051,`RP${id} half-range row ${j}`);
 }
}
close(num(examples[8].tables[2].rows[0][3]),2500,10,'Boyle pV at 100 kPa');
close(num(examples[9].tables[1].rows[2][3]),Math.log(2.56),.003,'Discharge ln V at 40 s');
close(num(examples[10].tables[1].rows[3][3]),.00224*9.81,.00005,'Balance to force');
close(num(examples[11].tables[2].rows[0][4]),.503/2,.0001,'Oscilloscope Vpp to peak');
const gamma=examples[12].tables[2].rows[2];
close(num(gamma[3]),(692+718+664)/3/60-37/120,.001,'Gamma corrected rate at 0.40 m');
close(num(gamma[4]),Math.sqrt(((692+718+664)/3)/3600+37/14400),.001,'Gamma count uncertainty');
const slope=(rows,ix,iy,sx=1,sy=1)=>{const a=rows.map(r=>[num(r[ix])*sx,num(r[iy])*sy]),xm=a.reduce((s,p)=>s+p[0],0)/a.length,ym=a.reduce((s,p)=>s+p[1],0)/a.length;return a.reduce((s,p)=>s+(p[0]-xm)*(p[1]-ym),0)/a.reduce((s,p)=>s+(p[0]-xm)**2,0);};
close(slope(examples[1].tables[1].rows,3,1),31.6,.2,'RP1 length gradient');
close(slope(examples[2].tables[1].rows,0,3),2.10,.03,'RP2 double-slit gradient');
close(slope(examples[2].tables[4].rows,3,4),6.30e-7,.07e-7,'RP2 grating gradient');
close(slope(examples[3].tables[1].rows,3,0),4.90,.08,'RP3 free-fall gradient');
close(slope(examples[4].tables[2].rows,4,3,1e-4,1e6),2.00e11,.03e11,'RP4 stress-strain gradient');
close(slope(examples[5].tables[3].rows,0,1),3.09,.02,'RP5 R-L gradient');
close(slope(examples[6].tables[2].rows,0,1),-.400,.02,'RP6 terminal-pd gradient');
close(slope(examples[7].tables[1].rows,0,4),4.02,.08,'RP7 pendulum gradient');
close(slope(examples[7].tables[3].rows,0,4),1.974,.08,'RP7 spring gradient');
close(slope(examples[8].tables[2].rows,4,1),2500,70,'RP8 Boyle gradient');
close(slope(examples[8].tables[4].rows,3,1),.1705,.006,'RP8 Charles gradient');
close(slope(examples[9].tables[1].rows,0,3),-.0213,.001,'RP9 discharge gradient');
close(slope(examples[9].tables[3].rows,0,4),-.0213,.001,'RP9 charge gradient');
close(slope(examples[10].tables[1].rows,0,3),.0110,.0003,'RP10 force-current gradient');
close(slope(examples[11].tables[2].rows,3,4),.251,.005,'RP11 emf-cosine gradient');
close(slope(examples[12].tables[2].rows,1,3),1.8,.1,'RP12 inverse-square gradient');
// The separate detail layers must not reintroduce headline answers from old datasets.
const detail2=fs.readFileSync(path.join(root,'lab-book-example-detail-v2b.js'),'utf8');
const detail3=fs.readFileSync(path.join(root,'lab-book-example-detail-v3.js'),'utf8');
const baseViewer=fs.readFileSync(path.join(root,'lab-book-examples.js'),'utf8');
for(const [id,numbers] of [[3,['9.8']],[6,['1.55','0.40']],[9,['46.9','0.0213']],[10,['0.220']],[11,['8.0 × 10⁻⁴']]]){
 const line=detail3.split(/\r?\n/).find(s=>s.startsWith(`${id}:{`));
 assert.ok(line,`RP${id}: final wording exists`);
 for(const number of numbers){assert.ok(line.includes(number),`RP${id}: final wording includes ${number}`);assert.ok(examples[id].result.includes(number)||examples[id].calc.includes(number),`RP${id}: completed data includes ${number}`);}
}
for(const stale of ['9.75 m s⁻²','1.52 V and r = 0.64 Ω','RC = 4.00 s','For L = 0.800 m and f = 35.7 Hz'])assert.ok(!detail2.includes(stale)&&!detail3.includes(stale),`Stale answer remains: ${stale}`);
assert.ok(baseViewer.includes('Illustrative example (undated; no real session took place)'),'Fictional examples must not be dated as observed work');
console.log('12 complete examples verified; all table shapes, repeated means, units-linked calculations and multi-part AQA coverage pass.');
