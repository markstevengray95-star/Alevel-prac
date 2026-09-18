'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push(`console: ${m.text()}`);});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__simulationVisualsV5Ready===true,{timeout:15000});

  const expected={
    1:'.v5-wave-guide',2:'.v5-optics',3:'.v5-freefall',4:'.v5-young',
    5:'.v5-resistivity',6:'.v5-cell',7:'.v5-shm',8:'.v5-gas',
    9:'.v5-capacitor',10:'.v5-magnetic',11:'.v5-induction',12:'.v5-inverse-square'
  };

  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(35);
    const modes=await page.evaluate(()=>current.modes.length);
    for(let mode=0;mode<modes;mode++){
      await page.evaluate(mode=>{
        running=false;simT=0;currentMode=mode;renderModeTabs();renderPractical();
        window.__animationRuntime?.forceFrame();
        window.__simulationVisualsV5?.refresh({test:true});
      },mode);
      await page.waitForTimeout(20);

      if(await page.locator('#simulationPhysicsV5').count()!==1)throw new Error(`P${id} mode ${mode}: visual overlay missing`);
      if(await page.locator(`#simulationPhysicsV5 ${expected[id]}`).count()!==1)throw new Error(`P${id} mode ${mode}: expected visual group ${expected[id]} missing`);
      const overlay=await page.locator('#simulationPhysicsV5').innerHTML();
      if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(overlay))throw new Error(`P${id} mode ${mode}: invalid visual output`);
      const layer=await page.locator('#scene').getAttribute('data-physics-layer');
      if(layer!=='v5')throw new Error(`P${id} mode ${mode}: scene not marked v5`);
    }

    const before=await page.evaluate(()=>window.__animationRuntime.time());
    await page.evaluate(()=>window.__animationRuntime.start());
    await page.waitForTimeout(80);
    await page.evaluate(()=>window.__animationRuntime.forceFrame());
    const after=await page.evaluate(()=>window.__animationRuntime.time());
    if(!(after>before))throw new Error(`P${id}: simulation time did not advance with visuals enabled`);
    if(!(await page.locator('#scene').evaluate(el=>el.classList.contains('v5-running'))))throw new Error(`P${id}: running visual state missing`);
    await page.evaluate(()=>window.__animationRuntime.pause());
    await page.waitForTimeout(20);
    const read=await page.locator('#readouts').innerText();
    if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(read))throw new Error(`P${id}: invalid readout after visual run`);
  }

  const api=await page.evaluate(()=>({version:window.__simulationVisualsV5?.version,ready:window.__simulationVisualsV5Ready,tools:document.querySelectorAll('.visual-tools').length}));
  if(api.version!=='5.0'||api.ready!==true)throw new Error('Visuals v5 API not ready');
  if(api.tools>1)throw new Error('Visual pass duplicated the workbench toolbar');
  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Simulation visuals v5 smoke passed: all 12 practicals/modes, physics overlays, running state and finite readouts.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});