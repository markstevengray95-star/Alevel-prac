'use strict';
const { chromium } = require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  const invalidValue=/\b(?:NaN|undefined|Infinity|null)\b/i;
  page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/i.test(m.text()))errors.push(`console: ${m.text()}`);});
  page.on('dialog',async d=>{errors.push(`unexpected dialog: ${d.message()}`);await d.dismiss();});

  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.navigate==='function'&&typeof window.theoretical==='function');
  await page.waitForFunction(()=>window.__enhancementStackReady===true&&window.__animationRuntime&&window.__labBookV2&&window.LAB_BOOK_EXAMPLES,{timeout:10000});
  await page.waitForTimeout(180);

  const mustMove=new Set([1,3,4,5,7,8,9,10,11,12]);
  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(120);
    const modeCount=await page.locator('#modeTabs button').count();
    if(modeCount<1)throw new Error(`P${id}: no modes rendered`);

    for(let mode=0;mode<modeCount;mode++){
      await page.locator('#modeTabs button').nth(mode).click();
      await page.waitForTimeout(90);
      if(await page.locator('#scene svg').count()!==1)throw new Error(`P${id} mode ${mode}: scene SVG missing`);
      if(await page.locator('#controls input[type=range]').count()<1)throw new Error(`P${id} mode ${mode}: controls missing`);
      if(await page.locator('.aqa-setup-card').count()!==1)throw new Error(`P${id} mode ${mode}: AQA setup check missing`);

      const before=await page.evaluate(()=>({t:window.__animationRuntime.time(),svg:document.querySelector('#scene svg')?.outerHTML||''}));
      await page.locator('#runBtn').click();
      await page.waitForTimeout(id===3?520:260);
      const afterRun=await page.evaluate(()=>({t:window.__animationRuntime.time(),svg:document.querySelector('#scene svg')?.outerHTML||'',running:window.__animationRuntime.running()}));
      if(!(afterRun.t>before.t))throw new Error(`P${id} mode ${mode}: simulation time did not advance`);
      if(mustMove.has(id)&&afterRun.svg===before.svg)throw new Error(`P${id} mode ${mode}: SVG did not visibly change after Run`);

      const readout=await page.locator('#readouts').innerText();
      if(invalidValue.test(readout))throw new Error(`P${id} mode ${mode}: invalid readout: ${readout}`);
      const sceneText=await page.locator('#scene').innerText().catch(()=> '');
      if(invalidValue.test(sceneText))throw new Error(`P${id} mode ${mode}: invalid scene text: ${sceneText}`);

      const rowsBefore=await page.locator('#resultsTable tbody tr').count().catch(()=>0);
      await page.locator('#recordBtn').click();
      await page.waitForTimeout(40);
      const rowsAfter=await page.locator('#resultsTable tbody tr').count().catch(()=>0);
      if(rowsAfter<=rowsBefore)throw new Error(`P${id} mode ${mode}: recording did not append a row`);

      await page.locator('#pauseBtn').click().catch(()=>{});
      await page.locator('#resetBtn').click();
      await page.waitForTimeout(40);
      const resetT=await page.evaluate(()=>window.__animationRuntime.time());
      if(resetT!==0)throw new Error(`P${id} mode ${mode}: Reset did not return time to zero`);
    }
  }

  await page.evaluate(()=>navigate('practical',8));
  await page.waitForTimeout(160);
  for(const part of ['Gas syringe','Mass holder + slotted masses','String loop'])if(await page.locator(`#scene [data-part="${part}"]`).count()!==1)throw new Error(`P8 Boyle missing ${part}`);
  if(await page.locator('#p8Seal').count()!==1)throw new Error('P8 Boyle rubber-seal diameter control missing');
  const boyle=await page.evaluate(()=>{const vals=getVals();vals[0]=200;const light=theoretical();vals[0]=1000;const heavy=theoretical();vals[0]=400;renderControls();renderScene();return {pLight:light.x,pHeavy:heavy.x,invVLight:light.y,invVHeavy:heavy.y};});
  if(!(boyle.pHeavy<boyle.pLight&&boyle.invVHeavy<boyle.invVLight))throw new Error(`P8 Boyle force balance incorrect: ${JSON.stringify(boyle)}`);

  await page.evaluate(()=>navigate('practical',5));await page.waitForTimeout(180);
  if(await page.locator('#handsTool').count()!==1)throw new Error('Hands-on toolbar failed to load');
  await page.evaluate(()=>navigate('circuit'));await page.waitForTimeout(100);
  if(await page.locator('.builder-shell').count()!==1||await page.locator('.build-slot').count()<5)throw new Error('Circuit builder failed to load');

  await page.evaluate(()=>navigate('labbook'));await page.waitForTimeout(180);
  if(await page.locator('#view-labbook.active .labbook-v2').count()!==1)throw new Error('Lab Book v2 did not render');
  if(await page.locator('.lb-card').count()!==12)throw new Error('Lab Book dashboard should show 12 practicals');
  if(await page.locator('[data-lb-step]').count()!==9)throw new Error('Lab Book should have 9 guided sections');
  if(await page.locator('#lbSelect option').count()!==12)throw new Error('Lab Book selector should cover all 12 practicals');
  if(await page.locator('#lbModeMine').count()!==1||await page.locator('#lbModeExample').count()!==1)throw new Error('Lab Book My record / Completed example switch missing');

  await page.locator('[data-lb-step="4"]').click();await page.waitForTimeout(30);
  if(await page.locator('#lbImportSim').count()!==1||await page.locator('.lb-table').count()<1)throw new Error('Structured raw-data section missing');
  const rawCount=await page.locator('[data-raw-row]').count();await page.locator('#lbAddRaw').click();
  if(await page.locator('[data-raw-row]').count()<=rawCount)throw new Error('Lab Book add-row control failed');
  await page.locator('#lbImportSim').click();

  await page.locator('[data-lb-step="5"]').click();await page.waitForTimeout(25);
  if(await page.locator('[data-unc-row]').count()<1)throw new Error('Uncertainty table missing');
  await page.locator('[data-lb-step="7"]').click();await page.waitForTimeout(25);
  if(await page.locator('[data-eval-row]').count()<1)throw new Error('Evaluation table missing');
  await page.locator('#lbDone').check();await page.waitForTimeout(30);
  if(!(await page.locator('[data-lb-step="7"]').evaluate(el=>el.classList.contains('done'))))throw new Error('Lab Book completion state did not persist');

  await page.locator('#lbModeExample').click();await page.waitForTimeout(80);
  if(await page.locator('#lbCompletedExamplePane .ex-sheet').count()!==1)throw new Error('Inline completed-example record did not render');
  if(await page.locator('#lbCompletedExamplePane #exSelect option').count()!==12)throw new Error('Example viewer should cover all 12 practicals');
  for(let id=1;id<=12;id++){
    await page.locator('#lbCompletedExamplePane #exSelect').selectOption(String(id));await page.waitForTimeout(35);
    const pane=page.locator('#lbCompletedExamplePane');
    const text=await pane.innerText();
    if(!text.includes('COMPLETED EXAMPLE')||!text.includes('Conclusion')||!text.includes('Evaluation')||!text.includes('EXAMPLE RESULT'))throw new Error(`P${id}: completed example is incomplete`);
    if(await pane.locator('.ex-table').count()<2)throw new Error(`P${id}: example should include results and uncertainty/evaluation tables`);
  }
  await page.locator('#lbModeMine').click();

  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Chromium validation passed: animations, all practicals/modes, AQA setup checks, Lab Book v2 and inline worked examples for all 12 practicals.');
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1);});