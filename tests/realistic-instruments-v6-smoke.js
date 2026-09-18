'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push(`console: ${m.text()}`);});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__realisticInstrumentsV6Ready===true,{timeout:15000});

  if(await page.locator('.visual-tools').count()>1)throw new Error('v6 duplicated the permanent workbench toolbar');
  if(await page.locator('#instrumentPopoverV6').count()!==0)throw new Error('Instrument popover should be closed by default');

  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(30);
    const modes=await page.evaluate(()=>current.modes.length);
    for(let mode=0;mode<modes;mode++){
      await page.evaluate(mode=>{
        running=false;simT=0;currentMode=mode;renderModeTabs();renderPractical();
        window.__animationRuntime?.forceFrame();
        window.__realisticInstrumentsV6?.refresh({test:true});
      },mode);
      await page.waitForTimeout(20);
      if(await page.locator('#instrumentRealismV6').count()!==1)throw new Error(`P${id} mode ${mode}: v6 SVG layer missing`);
      const html=await page.locator('#instrumentRealismV6').innerHTML();
      if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(html))throw new Error(`P${id} mode ${mode}: invalid v6 visual output`);
      if(await page.locator('#scene').getAttribute('data-instrument-layer')!=='v6')throw new Error(`P${id} mode ${mode}: scene not marked v6`);
    }
  }

  // P3: light-gate LEDs and logger digits.
  await page.evaluate(()=>{navigate('practical',3);window.__animationRuntime.forceFrame();window.__realisticInstrumentsV6.refresh();});
  if(await page.locator('.v6-gate-led').count()<2)throw new Error('P3 light-gate LEDs missing');
  if(await page.locator('.v6-logger-digits').count()!==1)throw new Error('P3 logger display missing');
  await page.locator('#scene [data-part="Data logger"]').click();
  if(!(await page.locator('#instrumentPopoverV6').innerText()).includes('ELECTRONIC TIMING'))throw new Error('P3 data logger focus panel missing');

  // P4: micrometer and vernier; zeroing must update instrument state.
  await page.evaluate(()=>{navigate('practical',4);window.__animationRuntime.forceFrame();window.__realisticInstrumentsV6.refresh();});
  if(await page.locator('.v6-micro').count()!==1)throw new Error('P4 micrometer scale missing');
  if(await page.locator('.v6-vernier').count()!==1)throw new Error('P4 vernier scale missing');
  await page.locator('#scene [data-part="Micrometer"]').click();
  let panel=await page.locator('#instrumentPopoverV6').innerText();
  if(!/INDICATED|Corrected/.test(panel))throw new Error('P4 micrometer focus panel incomplete');
  await page.locator('[data-v6-zero]').click();
  const z=await page.evaluate(()=>window.__realisticInstrumentsV6.state.micZero[4]);
  if(z!==0)throw new Error('Micrometer zero control did not clear zero error');

  // P5: both meters plus range selection and draggable connector.
  await page.evaluate(()=>{navigate('practical',5);window.__animationRuntime.forceFrame();window.__realisticInstrumentsV6.refresh();});
  if(await page.locator('.v6-meter').count()<2)throw new Error('P5 realistic meter overlays missing');
  await page.locator('#scene [data-part="Voltmeter"]').click();
  const range=page.locator('[data-v6-range="V"]');
  await range.selectOption('20');
  const mr=await page.evaluate(()=>window.__realisticInstrumentsV6.state.meterRanges['5:V']);
  if(mr!==20)throw new Error('Voltmeter range selection did not persist');
  const lead=page.locator('.v6-lead-handle');
  if(await lead.count()!==1)throw new Error('P5 draggable connector missing');
  const bb=await lead.boundingBox();if(!bb)throw new Error('P5 connector has no bounding box');
  await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await page.mouse.down();await page.mouse.move(bb.x+45,bb.y+20,{steps:3});await page.mouse.up();
  if(await page.evaluate(()=>window.__realisticInstrumentsV6.state.leadDrag)!==null)throw new Error('Connector drag state did not clear');

  // P8 Boyle: micrometer source must be the modelled plunger/seal diameter, not atmospheric pressure.
  await page.evaluate(()=>{navigate('practical',8);currentMode=0;renderModeTabs();renderPractical();window.__animationRuntime.forceFrame();window.__realisticInstrumentsV6.refresh();});
  await page.locator('#scene [data-part="Micrometer"]').click();
  panel=await page.locator('#instrumentPopoverV6').innerText();
  const mmMatch=panel.match(/(\d+\.\d+) mm/);
  if(!mmMatch)throw new Error('P8 micrometer reading missing');
  const mm=+mmMatch[1];if(mm<15||mm>25)throw new Error(`P8 micrometer source implausible: ${mm} mm`);

  // P11: oscilloscope controls alter only display scaling and keep the model running.
  await page.evaluate(()=>{navigate('practical',11);window.__animationRuntime.forceFrame();window.__realisticInstrumentsV6.refresh();});
  if(await page.locator('.v6-scope-trace').count()!==1)throw new Error('P11 enhanced oscilloscope trace missing');
  await page.locator('#scene [data-part="Oscilloscope"]').click();
  await page.locator('[data-v6-scope-v]').fill('1.2');
  await page.locator('[data-v6-scope-t]').fill('12');
  const scope=await page.evaluate(()=>({v:window.__realisticInstrumentsV6.state.scopeVdiv,t:window.__realisticInstrumentsV6.state.scopeTimeMs}));
  if(scope.v!==1.2||scope.t!==12)throw new Error(`Oscilloscope controls failed: ${JSON.stringify(scope)}`);
  const before=await page.evaluate(()=>window.__animationRuntime.time());
  await page.evaluate(()=>window.__animationRuntime.start());await page.waitForTimeout(90);
  const after=await page.evaluate(()=>window.__animationRuntime.time());
  await page.evaluate(()=>window.__animationRuntime.pause());
  if(!(after>before))throw new Error('Simulation timing stopped after v6 instrument controls');

  const api=await page.evaluate(()=>({ready:window.__realisticInstrumentsV6Ready,version:window.__realisticInstrumentsV6.version}));
  if(!api.ready||api.version!=='6.0')throw new Error('v6 API not ready');
  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Realistic instruments v6 smoke passed: all practicals/modes, meters, micrometer/vernier, light gates, oscilloscope and draggable connectors.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});