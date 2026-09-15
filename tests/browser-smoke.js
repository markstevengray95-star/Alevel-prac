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
  await page.waitForTimeout(500);

  for(let id=1;id<=12;id++){
    await page.evaluate(id=>navigate('practical',id),id);
    await page.waitForTimeout(120);
    const modeCount=await page.locator('#modeTabs button').count();
    if(modeCount<1)throw new Error(`P${id}: no modes rendered`);

    for(let mode=0;mode<modeCount;mode++){
      await page.locator('#modeTabs button').nth(mode).click();
      await page.waitForTimeout(80);
      if(await page.locator('#scene svg').count()!==1)throw new Error(`P${id} mode ${mode}: scene SVG missing`);
      if(await page.locator('#controls input[type=range]').count()<1)throw new Error(`P${id} mode ${mode}: controls missing`);

      await page.locator('#runBtn').click();
      await page.waitForTimeout(id===3?700:280);

      const readout=await page.locator('#readouts').innerText();
      if(invalidValue.test(readout))throw new Error(`P${id} mode ${mode}: invalid readout: ${readout}`);
      const sceneText=await page.locator('#scene').innerText().catch(()=> '');
      if(invalidValue.test(sceneText))throw new Error(`P${id} mode ${mode}: invalid scene text: ${sceneText}`);

      // Default P1 drive starts at resonance; recording should therefore be valid.
      const before=await page.locator('#resultsTable tbody tr').count().catch(()=>0);
      await page.locator('#recordBtn').click();
      await page.waitForTimeout(50);
      const after=await page.locator('#resultsTable tbody tr').count().catch(()=>0);
      if(after<=before)throw new Error(`P${id} mode ${mode}: recording did not append a row`);

      if(await page.locator('#pauseBtn').count())await page.locator('#pauseBtn').click();
      await page.locator('#resetBtn').click();
      await page.waitForTimeout(30);
    }
  }

  // Check the hands-on layer is present after practical rendering.
  await page.evaluate(()=>navigate('practical',5));
  await page.waitForTimeout(250);
  if(await page.locator('#handsTool').count()!==1)throw new Error('Hands-on toolbar failed to load');
  if(await page.locator('#scene [data-part="Sliding contact"]').count()!==1)throw new Error('P5 draggable sliding contact missing');

  // Check circuit builder loads and has its expected challenge slots.
  await page.evaluate(()=>navigate('circuit'));
  await page.waitForTimeout(100);
  if(await page.locator('.builder-shell').count()!==1)throw new Error('Circuit builder failed to load');
  if(await page.locator('.build-slot').count()<5)throw new Error('Circuit builder slots missing');

  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Chromium smoke test passed for all 12 practicals, all modes, recording, hands-on layer and circuit builder.');
  await browser.close();
})().catch(async e=>{console.error(e.stack||e);process.exit(1);});