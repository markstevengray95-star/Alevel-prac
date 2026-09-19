'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__practical3DEquipmentV11Ready===true,{timeout:20000});

  const targets={
    1:['vibration'],2:['laser','grating'],3:['datalogger'],4:['micrometer'],5:['ammeter'],6:['lamp'],
    7:['pendulum','spring'],8:['syringe','waterbath'],9:['capacitor'],10:['balance'],11:['searchcoil'],12:['gmtube']
  };

  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(30);
    const modes=await page.evaluate(()=>current.modes.length);
    for(let mode=0;mode<modes;mode++){
      await page.evaluate(mode=>{currentMode=mode;renderModeTabs();renderPractical();},mode);
      const selector=id===2?'#doubleSlit3d':id===4?'#young3d':'#practical3d';
      await page.waitForFunction(sel=>document.querySelector(sel)?.dataset.interactive3d==='v11'&&window.__practical3DInteractive?.version==='11.0',selector,{timeout:16000});
      await page.locator(selector).evaluate(el=>{const d=el.closest('details');if(d)d.open=true;});
      await page.waitForTimeout(40);

      const names=await page.evaluate(()=>window.__practical3DInteractive.listObjects());
      if(!names.length)throw new Error(`P${id} mode ${mode}: no named 3D objects`);
      const wanted=(targets[id]||[])[mode]||(targets[id]||[])[0];
      const match=names.find(n=>n.toLowerCase().replace(/[^a-z0-9]/g,'').includes(String(wanted).toLowerCase()));
      if(!match)throw new Error(`P${id} mode ${mode}: expected selectable equipment containing "${wanted}", got ${names.slice(0,20).join(', ')}`);

      const point=await page.evaluate(name=>window.__practical3DInteractive.screenPoint(name),match);
      if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))throw new Error(`P${id} mode ${mode}: no screen point for ${match}`);
      const picked=await page.evaluate(({x,y})=>window.__practical3DInteractive.pickAt(x,y),point);
      if(!picked)throw new Error(`P${id} mode ${mode}: picking failed at target point`);

      await page.mouse.move(point.x,point.y);
      await page.waitForTimeout(20);
      await page.mouse.click(point.x,point.y);
      const panel=page.locator(selector+' .practical3d-info');
      await panel.waitFor({state:'visible',timeout:3000});
      const info=await panel.innerText();
      for(const phrase of ['Purpose','How it works','Correct use','Common mistake'])if(!info.includes(phrase))throw new Error(`P${id} mode ${mode}: info panel missing ${phrase}`);
      if(await panel.locator('[data-3d-demo]').count()!==1)throw new Error(`P${id} mode ${mode}: how-it-works demo missing`);

      await page.locator(selector+' [data-3d-labels]').click();
      if(!(await page.evaluate(()=>window.__practical3DInteractive.state.labels)))throw new Error(`P${id} mode ${mode}: labels state did not enable`);
      if(await page.locator(selector+' .practical3d-label-layer button').count()<1)throw new Error(`P${id} mode ${mode}: labels did not render`);

      await page.locator(selector+' [data-3d-xray]').click();
      if(!(await page.evaluate(()=>window.__practical3DInteractive.state.xray)))throw new Error(`P${id} mode ${mode}: X-ray state did not enable`);
      await page.locator(selector+' [data-3d-explode]').click();
      if(!(await page.evaluate(()=>window.__practical3DInteractive.state.exploded)))throw new Error(`P${id} mode ${mode}: exploded state did not enable`);

      await page.locator(selector+' [data-3d-tutorial]').click();
      await panel.waitFor({state:'visible'});
      if(!/TUTORIAL/.test(await panel.innerText()))throw new Error(`P${id} mode ${mode}: tutorial did not select equipment`);

      await page.locator(selector+' [data-3d-quiz]').click();
      const status=await page.locator(selector+' .young3d-status').innerText();
      if(!status.startsWith('Quiz: click the '))throw new Error(`P${id} mode ${mode}: quiz prompt missing`);

      await page.locator(selector+' [data-3d-reset-objects]').click();
      const reset=await page.evaluate(()=>({
        xray:window.__practical3DInteractive.state.xray,
        exploded:window.__practical3DInteractive.state.exploded,
        labels:window.__practical3DInteractive.state.labels,
        tool:window.__practical3DInteractive.state.tool
      }));
      if(reset.xray||reset.exploded||reset.labels||reset.tool!=='orbit')throw new Error(`P${id} mode ${mode}: reset did not restore guided state`);
    }
  }

  // Real free-move pointer drag on isolated P3 data logger.
  await page.evaluate(()=>{navigate('practical',3);currentMode=0;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.interactive3d==='v11');
  await page.locator('#practical3d').evaluate(el=>el.closest('details').open=true);
  const beforePhysics=await page.evaluate(()=>JSON.stringify(theoretical()));
  const dataName=await page.evaluate(()=>window.__practical3DInteractive.listObjects().find(n=>/datalogger/i.test(n)));
  if(!dataName)throw new Error('P3 data logger mesh missing for movement test');
  await page.locator('#practical3d [data-3d-mode]').click();
  const beforeOffset=await page.evaluate(name=>window.__practical3DInteractive.offsetOf(name),dataName);
  const p=await page.evaluate(name=>window.__practical3DInteractive.screenPoint(name),dataName);
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+55,p.y-28,{steps:5});await page.mouse.up();
  const afterOffset=await page.evaluate(name=>window.__practical3DInteractive.offsetOf(name),dataName);
  if(!afterOffset||afterOffset.every((v,i)=>Math.abs(v-beforeOffset[i])<1e-5))throw new Error('Free-move drag did not change 3D equipment offset');
  const afterPhysics=await page.evaluate(()=>JSON.stringify(theoretical()));
  if(afterPhysics!==beforePhysics)throw new Error('3D exploration movement changed the underlying physics model');
  await page.locator('#practical3d [data-3d-reset-objects]').click();
  const restored=await page.evaluate(name=>window.__practical3DInteractive.offsetOf(name),dataName);
  if(restored.some(v=>Math.abs(v)>1e-8))throw new Error('Reset apparatus did not restore 3D equipment position');

  // Actual hover/click selection and demo.
  const p2=await page.evaluate(name=>window.__practical3DInteractive.screenPoint(name),dataName);
  await page.mouse.move(p2.x,p2.y);
  await page.mouse.click(p2.x,p2.y);
  await page.locator('#practical3d [data-3d-demo]').click();
  if(!/^Demonstrating /.test(await page.locator('#practical3d .young3d-status').innerText()))throw new Error('Show-how-it-works demo did not start');

  // Pan path and zoom must remain finite/smooth.
  const canvas=page.locator('#practical3d canvas'),box=await canvas.boundingBox();
  await page.keyboard.down('Shift');await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.58,box.y+box.height*.56,{steps:6});await page.mouse.up();await page.keyboard.up('Shift');
  await page.mouse.wheel(0,-180);
  const camera=await page.evaluate(()=>({target:window.__practical3DInteractive.state.target,radius:window.__practical3DInteractive.state.radius}));
  if(!camera.target.every(Number.isFinite)||!Number.isFinite(camera.radius))throw new Error('3D pan/zoom produced invalid camera state');

  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log('Interactive 3D v11 smoke passed: every practical/mode supports equipment selection, explanations, labels, X-ray, explode, tutorial, quiz, reset; free-move drag preserves physics.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});