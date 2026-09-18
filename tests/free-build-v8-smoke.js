'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:1200}});
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__freeBuildBenchV8Ready===true,{timeout:15000});

  // Full reference-build sweep: every practical and every investigation mode.
  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(25);
    const modes=await page.evaluate(()=>current.modes.length);
    for(let mode=0;mode<modes;mode++){
      await page.evaluate(mode=>{
        running=false;simT=0;currentMode=mode;renderModeTabs();renderPractical();
        window.__freeBuildBenchV8.setMode();
      },mode);
      await page.waitForTimeout(30);

      const empty=await page.evaluate(()=>({
        placed:window.__freeBuildBenchV8.session().placed.length,
        valid:window.__freeBuildBenchV8.validate().ready
      }));
      if(empty.placed!==0||empty.valid)throw new Error(`P${id} mode ${mode}: free build did not start empty`);
      if(!(await page.locator('#runBtn').isDisabled()))throw new Error(`P${id} mode ${mode}: Run should be locked on empty bench`);
      if(!(await page.locator('#recordBtn').isDisabled()))throw new Error(`P${id} mode ${mode}: Record should be locked on empty bench`);
      if(await page.locator('#freeBuildSceneLock').count()!==1)throw new Error(`P${id} mode ${mode}: live apparatus lock missing`);

      await page.evaluate(()=>window.__freeBuildBenchV8.reference());
      await page.waitForTimeout(30);
      const v=await page.evaluate(()=>window.__freeBuildBenchV8.validate());
      if(!v.ready||v.score!==100)throw new Error(`P${id} mode ${mode}: reference build failed validation: ${JSON.stringify(v)}`);
      if(await page.locator('#runBtn').isDisabled())throw new Error(`P${id} mode ${mode}: Run stayed locked after valid build`);
      if(await page.locator('#recordBtn').isDisabled())throw new Error(`P${id} mode ${mode}: Record stayed locked after valid build`);
      if(await page.locator('#freeBuildSceneLock').count()!==0)throw new Error(`P${id} mode ${mode}: live apparatus did not unlock`);

      const html=await page.locator('#freeBuildV8').innerHTML();
      if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(html))throw new Error(`P${id} mode ${mode}: invalid free-build HTML`);
      await page.evaluate(()=>window.__freeBuildBenchV8.reset());
    }
  }

  // Real drag-from-tray interaction on P2.
  await page.evaluate(()=>{navigate('practical',2);currentMode=0;renderModeTabs();renderPractical();window.__freeBuildBenchV8.setMode();});
  await page.waitForTimeout(40);
  const trayLight=page.locator('[data-fb-tray="light"]');
  const bench=page.locator('#freeBuildBench');
  if(await trayLight.count()!==1)throw new Error('P2 light source missing from free-build tray');
  await trayLight.dragTo(bench,{targetPosition:{x:90,y:170}});
  await page.waitForTimeout(30);
  const placedLight=await page.evaluate(()=>window.__freeBuildBenchV8.session().placed.includes('light'));
  if(!placedLight)throw new Error('HTML5 tray drag did not place P2 light source');

  // Finish P5 from reference, inject an incorrect cable, and ensure exact connection validation locks the experiment.
  await page.evaluate(()=>{navigate('practical',5);window.__freeBuildBenchV8.setMode();window.__freeBuildBenchV8.reference();});
  await page.waitForTimeout(40);
  let v5=await page.evaluate(()=>window.__freeBuildBenchV8.validate());
  if(!v5.ready)throw new Error('P5 reference build should be ready');

  await page.evaluate(()=>window.__freeBuildBenchV8.connect('psu','volt'));
  await page.waitForTimeout(30);
  v5=await page.evaluate(()=>window.__freeBuildBenchV8.validate());
  if(v5.ready||!v5.wrongLinks.includes('psu|volt'))throw new Error('P5 extra wrong connection was not rejected');
  if(!(await page.locator('#runBtn').isDisabled())||!(await page.locator('#recordBtn').isDisabled()))throw new Error('Wrong free-build cable did not relock measurements');
  await page.evaluate(()=>window.__freeBuildBenchV8.disconnect('psu|volt'));
  await page.waitForTimeout(30);
  if(!(await page.evaluate(()=>window.__freeBuildBenchV8.validate().ready)))throw new Error('P5 did not recover after wrong cable removal');

  // Actual click-port-then-click-port connection on an empty P6 bench.
  await page.evaluate(()=>{navigate('practical',6);window.__freeBuildBenchV8.setMode();});
  await page.waitForTimeout(30);
  for(const id of ['cell','amm','var','switch','volt'])await page.evaluate(id=>window.__freeBuildBenchV8.place(id,45,45),id);
  await page.waitForTimeout(30);
  const cellPort=page.locator('[data-fb-node="cell"] [data-fb-port="cell"]').first();
  const ammPort=page.locator('[data-fb-node="amm"] [data-fb-port="amm"]').first();
  await cellPort.click();
  await ammPort.click();
  await page.waitForTimeout(30);
  const clickedLink=await page.evaluate(()=>window.__freeBuildBenchV8.session().links.includes('amm|cell'));
  if(!clickedLink)throw new Error('Click-port connection did not create cell ↔ ammeter cable');

  // Geometry is part of validation, not just component presence.
  await page.evaluate(()=>{navigate('practical',3);window.__freeBuildBenchV8.setMode();window.__freeBuildBenchV8.reference();window.__freeBuildBenchV8.setPosition('release',80,10);});
  await page.waitForTimeout(30);
  const g3=await page.evaluate(()=>window.__freeBuildBenchV8.validate());
  if(g3.ready||!g3.geoBad.length)throw new Error('P3 bad physical alignment did not fail geometry validation');
  if(!(await page.locator('#runBtn').isDisabled()))throw new Error('P3 geometry fault did not lock Run');

  // Returning to guided mode restores normal simulation controls.
  await page.evaluate(()=>window.__freeBuildBenchV8.leaveMode('guided'));
  await page.waitForTimeout(30);
  if(await page.locator('#runBtn').isDisabled())throw new Error('Leaving Free build did not restore Run control');
  if(await page.locator('.workbench').evaluate(el=>el.classList.contains('free-build-active')))throw new Error('Free-build workbench class remained after leaving mode');

  const api=await page.evaluate(()=>({ready:window.__freeBuildBenchV8Ready,version:window.__freeBuildBenchV8.version}));
  if(!api.ready||api.version!=='8.0')throw new Error('Free-build v8 API not ready');
  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log('Free-build v8 smoke passed: empty-bench locking, all-practical reference builds, tray dragging, port connections, exact wiring, geometry validation and guided-mode recovery.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});