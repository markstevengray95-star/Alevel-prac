'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push(`console: ${m.text()}`);});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.navigate==='function'&&window.__enhancementStackReady===true,{timeout:12000});
  await page.evaluate(()=>navigate('practical',5));
  await page.waitForFunction(()=>window.__animationRuntime?.version==='3.0'&&window.__setupSnapshotsReady===true&&window.__repeatAnalysisReady===true,{timeout:10000});
  await page.waitForSelector('#sandboxLiveScope',{timeout:10000});
  await page.waitForSelector('#setupSnapshots',{timeout:10000});
  await page.waitForSelector('#repeatAnalyser',{timeout:10000});

  // Runtime: time advances, interaction affordances survive redraws, pause stops time, reset clears time.
  const t0=await page.evaluate(()=>window.__animationRuntime.time());
  await page.locator('#runBtn').click();
  await page.waitForTimeout(420);
  const runState=await page.evaluate(()=>({t:window.__animationRuntime.time(),running:window.__animationRuntime.running(),drag:document.querySelector('#scene [data-part="Sliding contact"]')?.classList.contains('direct-manip')}));
  if(!(runState.t>t0)||!runState.running)throw new Error(`Runtime did not advance: ${JSON.stringify(runState)}`);
  if(!runState.drag)throw new Error('Hands-on apparatus lost its direct manipulation state during animation redraw');
  const liveText=await page.locator('#scopeRange').innerText();
  const liveValue=await page.locator('#scopeNow').innerText();
  if(/No live samples|Run the experiment/i.test(liveText)||liveValue.trim()==='—')throw new Error(`Live trace did not collect samples: ${liveValue} / ${liveText}`);
  await page.locator('#pauseBtn').click();
  const paused0=await page.evaluate(()=>window.__animationRuntime.time());
  await page.waitForTimeout(220);
  const paused1=await page.evaluate(()=>window.__animationRuntime.time());
  if(Math.abs(paused1-paused0)>.02)throw new Error(`Pause did not stop simulation time: ${paused0} -> ${paused1}`);
  await page.locator('#resetBtn').click();
  if(await page.evaluate(()=>window.__animationRuntime.time())!==0)throw new Error('Reset did not restore simulation time to zero');

  // Feature 2: save, change and restore a complete apparatus setup.
  const original=await page.locator('#rng0').inputValue();
  await page.locator('[data-save-snap="0"]').click();
  const changed=await page.evaluate(()=>{const r=document.querySelector('#rng0');r.value=r.max;r.dispatchEvent(new Event('input',{bubbles:true}));return r.value;});
  if(changed===original)throw new Error('Snapshot test could not change the apparatus variable');
  await page.locator('[data-restore-snap="0"]').click();
  const restored=await page.locator('#rng0').inputValue();
  if(Math.abs(Number(restored)-Number(original))>1e-9)throw new Error(`Setup snapshot restore failed: expected ${original}, got ${restored}`);

  // Feature 3: three repeats populate both the results table and the uncertainty analysis.
  await page.locator('#clearDataBtn').click();
  await page.locator('#repeatTakeThree').click();
  await page.waitForTimeout(80);
  const rows=await page.locator('#resultsTable tbody tr').count();
  if(rows<3)throw new Error(`Repeat analyser failed to record three readings; rows=${rows}`);
  const metrics=await page.locator('#repeatAnalysisBody').innerText();
  for(const term of ['Mean','Range','Half-range','%'])if(!metrics.includes(term))throw new Error(`Repeat analysis missing ${term}: ${metrics}`);

  // Quick integration sweep: all 12 practicals expose all three new tools and finite readouts.
  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);await page.waitForTimeout(120);
    if(await page.locator('#scene svg').count()!==1)throw new Error(`P${id}: scene missing`);
    if(await page.locator('#sandboxLiveScope').count()!==1)throw new Error(`P${id}: live trace missing`);
    if(await page.locator('#setupSnapshots').count()!==1)throw new Error(`P${id}: setup snapshots missing`);
    if(await page.locator('#repeatAnalyser').count()!==1)throw new Error(`P${id}: repeat analyser missing`);
    const text=await page.locator('#readouts').innerText();
    if(/\b(?:NaN|undefined|Infinity|null)\b/i.test(text))throw new Error(`P${id}: invalid readout: ${text}`);
  }

  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Sandbox v3 smoke passed: runtime, live trace, setup snapshots, repeat analysis, and all 12 practical integrations.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
