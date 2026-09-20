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

  await page.route('**/assets/rp03-free-fall.glb*',route=>route.fulfill({status:404,contentType:'text/plain',body:'forced missing model'}));
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__enhancementStackReady===true,{timeout:20000});
  await page.evaluate(()=>navigate('practical',3));

  await page.waitForFunction(()=>document.querySelector('#practical3d')?.dataset.modelSource==='procedural'&&window.__practical3DInteractive?.version==='14.1',{timeout:16000});
  const state=await page.evaluate(()=>({
    source:window.__practical3DInteractive.modelSource,
    names:window.__practical3DInteractive.listObjects(),
    loaded:document.querySelector('#practical3d')?.dataset.modelLoaded,
    status:document.querySelector('#practical3d .young3d-status')?.textContent
  }));
  if(state.source!=='procedural')throw new Error('Missing GLB did not use procedural fallback');
  if(state.loaded!=='true')throw new Error('Fallback did not mark viewer loaded');
  for(const wanted of ['Release mechanism','Ball bearing','Light gate','Data logger']){
    if(!state.names.some(n=>n.toLowerCase().includes(wanted.toLowerCase())))throw new Error('Fallback missing '+wanted);
  }
  if(!/fallback active/i.test(state.status||''))throw new Error('Fallback status is not visible');

  const selected=await page.evaluate(()=>window.__practical3DInteractive.selectByName('Ball bearing'));
  if(!selected)throw new Error('Fallback equipment could not be selected');
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

  if(errors.length)throw new Error('Browser errors:\n'+errors.join('\n'));
  console.log('Interactive 3D fallback smoke passed: a forced missing GLB still produces a selectable, labelled, X-ray/exploded interactive apparatus scene.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
