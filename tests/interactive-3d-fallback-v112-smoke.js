'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  // Block service workers so this regression can genuinely force the model
  // request to fail instead of receiving a cached GLB from the PWA cache.
  const context=await browser.newContext({viewport:{width:1400,height:1000},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push('console: '+m.text());});

  await page.route('**/assets/rp03-free-fall.glb*',route=>route.fulfill({status:404,contentType:'text/plain',body:'forced missing first-six model'}));
  await page.route('**/assets/rp07-pendulum.glb*',route=>route.fulfill({status:404,contentType:'text/plain',body:'forced missing later model'}));
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true,{timeout:20000});
  // P1-P6 are not allowed to disguise a failed detailed asset as the old box scene.
  await page.evaluate(()=>navigate('practical',3));
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelSource==='error',{timeout:16000});
  const firstSixFailure=await page.evaluate(()=>({
    source:document.querySelector('#practical3d')?.dataset.modelSource,
    loaded:document.querySelector('#practical3d')?.dataset.modelLoaded,
    status:document.querySelector('#practical3d .young3d-status')?.textContent,
    retry:!!document.querySelector('#practical3d [data-3d-retry]')
  }));
  if(firstSixFailure.source!=='error'||firstSixFailure.loaded!=='false')throw new Error('P3 incorrectly fell back to procedural boxes');
  if(!firstSixFailure.retry||!/Detailed 3D model failed/i.test(firstSixFailure.status||''))throw new Error('P3 detailed-model failure is not clearly recoverable');

  // Later practicals retain a procedural offline fallback.
  await page.evaluate(()=>{navigate('practical',7);currentMode=0;renderModeTabs();renderPractical();});
  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelSource==='procedural'&&window.__practical3DInteractive?.version==='14.2',{timeout:16000});
  const state=await page.evaluate(()=>({
    source:window.__practical3DInteractive.modelSource,
    names:window.__practical3DInteractive.listObjects(),
    loaded:document.querySelector('#practical3d')?.dataset.modelLoaded,
    status:document.querySelector('#practical3d .young3d-status')?.textContent
  }));
  if(state.source!=='procedural'||state.loaded!=='true')throw new Error('Later-practical procedural fallback did not load');
  for(const wanted of ['Retort stand','Pendulum','Pendulum bob','Metre rule']){
    if(!state.names.some(n=>n.toLowerCase().includes(wanted.toLowerCase())))throw new Error('P7 fallback missing '+wanted);
  }
  if(!/fallback active/i.test(state.status||''))throw new Error('Fallback status is not visible');

  const selected=await page.evaluate(()=>window.__practical3DInteractive.selectByName('Pendulum bob'));
  if(!selected)throw new Error('P7 fallback equipment could not be selected');
  await page.locator('#practical3d .practical3d-info').waitFor({state:'visible',timeout:3000});
  await page.locator('#practical3d [data-3d-labels]').click();
  await page.locator('#practical3d [data-3d-xray]').click();
  await page.locator('#practical3d [data-3d-explode]').click();
  const modes=await page.evaluate(()=>({
    labels:window.__practical3DInteractive.state.labels,
    xray:window.__practical3DInteractive.state.xray,
    exploded:window.__practical3DInteractive.state.exploded
  }));
  if(!modes.labels||!modes.xray||!modes.exploded)throw new Error('Fallback lost interactive viewer tools');

  // The forced P3 fetch logs are expected; no unhandled browser errors should remain.
  const unexpected=errors.filter(x=>!/Detailed apparatus GLB required for P1-P6|3D model HTTP 404/i.test(x));
  if(unexpected.length)throw new Error('Browser errors:\n'+unexpected.join('\n'));
  console.log('Interactive 3D fallback policy passed: P1-P6 refuse box fallback; later practicals retain the selectable offline fallback.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
